import { NextResponse } from "next/server";
import { parseLead } from "@/lib/lead";

export const runtime = "nodejs";

/**
 * Where a lead lands.
 *
 * NOT YET PERSISTED. The store is an open decision — Supabase per the process
 * diagram, or a ClickUp task, or both — so this validates, records that it
 * happened, and returns. Nothing is written anywhere durable yet.
 *
 * That is deliberate rather than unfinished: picking the store decides the
 * record shape, and guessing now means migrating later. See the "Persist every
 * end state to the database" task.
 *
 * WHOEVER WIRES THE STORE: this is the only place that needs to change. The
 * payload is already validated and shaped by the time it reaches the log line.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  let lead;
  try {
    lead = parseLead(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Please check your details.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  // Deliberately not logging the name, email or notes: this is personal data
  // and server logs are the wrong place for it. The shape is enough to confirm
  // the route works and to see the funnel moving.
  console.log("[lead] captured", {
    brand: lead.context.brandName,
    mode: lead.context.mode,
    versions: lead.context.versionCount,
    settledOn: lead.context.versionLabel,
    goals: lead.context.goals,
    hasNotes: lead.notes.length > 0,
  });

  return NextResponse.json({ ok: true });
}
