import { NextResponse } from "next/server";
import { getBuildVersion } from "@/lib/utils/build-version";

export async function GET() {
  return NextResponse.json({ version: getBuildVersion() });
}
