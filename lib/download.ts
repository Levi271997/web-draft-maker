/**
 * Handing the generated page over as files.
 *
 * The model writes one self-contained document with every rule in a <style>
 * block, which is right for an iframe preview and wrong for anyone who has to
 * work on it afterwards. So there are two shapes: the single file that opens
 * anywhere by double-clicking it, and the split pair a developer would expect.
 *
 * The zip is written by hand because the project has three dependencies and a
 * store-only archive is about forty lines. No compression — these are a few
 * hundred kilobytes of text and the saving isn't worth the deflate.
 *
 * Browser-only: Blob, URL and document all appear here.
 */

const encoder = new TextEncoder();

/** "Bergen Boiler Care" -> "bergen-boiler-care" */
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    // Combining marks, so "Bakerí" becomes "bakeri" rather than "bakeri-".
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return slug || "homepage";
}

/**
 * Pulls every <style> block out of the head and points the document at an
 * external stylesheet instead. Google Fonts <link> tags are left alone — they
 * are not ours to inline.
 */
export function splitStyles(html: string): { html: string; css: string } {
  const blocks: string[] = [];

  const stripped = html.replace(
    /[ \t]*<style\b[^>]*>([\s\S]*?)<\/style>\n?/gi,
    (_match, body: string) => {
      blocks.push(String(body).trim());
      return "";
    },
  );

  const css = blocks.join("\n\n");

  if (!css) return { html, css: "" };

  const link = '    <link rel="stylesheet" href="styles.css">\n';

  // Put the link where the styles were: last thing before </head>, so it still
  // wins over anything the font stylesheet sets.
  const withLink = /<\/head>/i.test(stripped)
    ? stripped.replace(/<\/head>/i, `${link}  </head>`)
    : `${link}${stripped}`;

  return { html: withLink, css };
}

/* ------------------------------------------------------------------ */
/* Minimal store-only zip                                             */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** MS-DOS packed date and time, which is what the zip format still wants. */
function dosStamp(date: Date): { time: number; date: number } {
  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      (Math.floor(date.getSeconds() / 2) & 0x1f),
    date:
      ((Math.max(1980, date.getFullYear()) - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
  };
}

export type ZipEntry = { name: string; content: string };

export function zip(entries: ZipEntry[]): Blob {
  const stamp = dosStamp(new Date());
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];

  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = encoder.encode(entry.content);
    const sum = crc32(data);

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 names
    lv.setUint16(8, 0, true); // stored
    lv.setUint16(10, stamp.time, true);
    lv.setUint16(12, stamp.date, true);
    lv.setUint32(14, sum, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);
    local.set(name, 30);

    parts.push(local, data);

    const dir = new Uint8Array(46 + name.length);
    const dv = new DataView(dir.buffer);
    dv.setUint32(0, 0x02014b50, true);
    dv.setUint16(4, 20, true); // version made by
    dv.setUint16(6, 20, true); // version needed
    dv.setUint16(8, 0x0800, true);
    dv.setUint16(10, 0, true);
    dv.setUint16(12, stamp.time, true);
    dv.setUint16(14, stamp.date, true);
    dv.setUint32(16, sum, true);
    dv.setUint32(20, data.length, true);
    dv.setUint32(24, data.length, true);
    dv.setUint16(28, name.length, true);
    dv.setUint32(42, offset, true);
    dir.set(name, 46);

    central.push(dir);
    offset += local.length + data.length;
  }

  const centralSize = central.reduce((total, part) => total + part.length, 0);

  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  // Flattened into one buffer rather than handed to Blob as a list of views:
  // TextEncoder returns Uint8Array<ArrayBufferLike>, which no longer satisfies
  // BlobPart now that the typed-array types are generic over their buffer.
  const chunks = [...parts, ...central, end];
  const output = new Uint8Array(chunks.reduce((total, part) => total + part.length, 0));

  let cursor = 0;
  for (const chunk of chunks) {
    output.set(chunk, cursor);
    cursor += chunk.length;
  }

  return new Blob([output], { type: "application/zip" });
}

/* ------------------------------------------------------------------ */

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Revoking immediately cancels the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function saveText(text: string, filename: string, mime: string): void {
  saveBlob(new Blob([text], { type: `${mime};charset=utf-8` }), filename);
}
