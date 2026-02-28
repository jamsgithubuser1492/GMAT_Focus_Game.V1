/**
 * /api/user — User Management
 *
 * POST: Create or retrieve a user. If email exists, returns existing user.
 * GET:  Retrieve user by userId query param.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface CreateUserBody {
  email: string;
  displayName: string;
  targetScore?: number;
  testDate?: string;
}

export async function POST(request: NextRequest) {
  let body: CreateUserBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, displayName, targetScore, testDate } = body;

  if (!email || !displayName) {
    return NextResponse.json(
      { error: "Missing required fields: email, displayName" },
      { status: 400 },
    );
  }

  // Upsert: return existing user or create new
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      displayName,
      targetScore: targetScore ?? 705,
      testDate: testDate ? new Date(testDate) : null,
    },
    include: { gamification: true },
  });

  // Create gamification row if it doesn't exist
  if (!user.gamification) {
    await prisma.gamification.create({
      data: { userId: user.id },
    });
  }

  // Create learner profiles for all skill nodes if they don't exist
  const existingProfiles = await prisma.learnerProfile.count({
    where: { userId: user.id },
  });

  if (existingProfiles === 0) {
    const skillNodes = await prisma.skillNode.findMany({ select: { id: true } });
    await prisma.learnerProfile.createMany({
      data: skillNodes.map((sn) => ({
        userId: user.id,
        skillNodeId: sn.id,
      })),
      skipDuplicates: true,
    });
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { gamification: true },
  });

  return NextResponse.json(fullUser, { status: 201 });
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing query param: userId" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { gamification: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
