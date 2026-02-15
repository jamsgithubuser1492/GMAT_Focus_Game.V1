/**
 * POST /api/exam-session/create
 *
 * Creates a new exam session (drill, section practice, or full exam).
 * Initializes the adaptive engine state for the session.
 *
 * Request body:
 *   - userId: string
 *   - sessionType: "drill" | "section_practice" | "full_exam"
 *   - sectionOrder?: string (e.g., "quant,verbal,di")
 *   - section?: GmatSection (required for drill/section_practice)
 *
 * Response:
 *   - 201: { sessionId, sessionType, startedAt, sectionsConfig }
 *   - 400: invalid request body
 */

import { NextRequest, NextResponse } from "next/server";
import { GMAT_FOCUS } from "@/lib/tutor-engine/types";
import type { GmatSection } from "@/lib/tutor-engine/types";

type SessionType = "drill" | "section_practice" | "full_exam";

interface CreateSessionBody {
  userId: string;
  sessionType: SessionType;
  sectionOrder?: string;
  section?: GmatSection;
}

interface SectionConfig {
  section: GmatSection;
  questionsCount: number;
  timeMinutes: number;
  editsAllowed: number;
  startingTheta: number;
}

export async function POST(request: NextRequest) {
  let body: CreateSessionBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, sessionType, sectionOrder, section } = body;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "Missing required field: userId" }, { status: 400 });
  }

  const validTypes: SessionType[] = ["drill", "section_practice", "full_exam"];
  if (!validTypes.includes(sessionType)) {
    return NextResponse.json(
      { error: `Invalid sessionType. Must be one of: ${validTypes.join(", ")}` },
      { status: 400 },
    );
  }

  // For drill and section_practice, a specific section is required
  if ((sessionType === "drill" || sessionType === "section_practice") && !section) {
    return NextResponse.json(
      { error: "Field 'section' is required for drill and section_practice sessions" },
      { status: 400 },
    );
  }

  // Build section configs
  let sections: SectionConfig[];

  if (sessionType === "full_exam") {
    const order = sectionOrder
      ? sectionOrder.split(",").map((s) => s.trim())
      : [...GMAT_FOCUS.SECTIONS];

    sections = order.map((s) => {
      const sec = s as GmatSection;
      return {
        section: sec,
        questionsCount: GMAT_FOCUS.QUESTIONS_PER_SECTION[sec] ?? 21,
        timeMinutes: GMAT_FOCUS.TIME_PER_SECTION_MINUTES,
        editsAllowed: GMAT_FOCUS.MAX_EDITS_PER_SECTION,
        startingTheta: 0.0,
      };
    });
  } else {
    const sec = section!;
    sections = [
      {
        section: sec,
        questionsCount:
          sessionType === "drill"
            ? 10
            : GMAT_FOCUS.QUESTIONS_PER_SECTION[sec] ?? 21,
        timeMinutes:
          sessionType === "drill"
            ? 15
            : GMAT_FOCUS.TIME_PER_SECTION_MINUTES,
        editsAllowed: GMAT_FOCUS.MAX_EDITS_PER_SECTION,
        startingTheta: 0.0,
      },
    ];
  }

  const sessionId = crypto.randomUUID();

  return NextResponse.json(
    {
      sessionId,
      userId,
      sessionType,
      startedAt: new Date().toISOString(),
      sectionsConfig: sections,
    },
    { status: 201 },
  );
}
