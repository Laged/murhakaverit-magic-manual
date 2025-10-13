import { NextResponse } from "next/server";
import { getFormOptions } from "@/lib/airtable/client";

/**
 * API endpoint to fetch fresh form options, especially for refreshing
 * accommodation availability after a failed submission due to capacity.
 */
export async function GET() {
  try {
    const options = await getFormOptions();

    return NextResponse.json({
      success: true,
      options,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch form options",
      },
      { status: 500 },
    );
  }
}
