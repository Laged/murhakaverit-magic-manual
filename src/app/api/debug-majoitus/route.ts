import { NextResponse } from "next/server";
import { getFormOptions } from "@/lib/airtable/client";

export async function GET() {
  try {
    const options = await getFormOptions();

    return NextResponse.json({
      success: true,
      majoitus: options.majoitus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
