import { NextResponse } from "next/server";
import { getPendingProposalCount } from "@/lib/db/queries/proposals";

export async function GET() {
  const count = await getPendingProposalCount();
  return NextResponse.json({ count });
}
