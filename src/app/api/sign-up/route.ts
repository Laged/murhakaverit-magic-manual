import { NextResponse } from "next/server";
import { getFormOptions, submitRegistration } from "@/lib/airtable/client";
import { SignUpFormSchema } from "@/lib/airtable/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the form data with Zod
    const validatedData = SignUpFormSchema.parse(body);

    // Check accommodation availability before submitting
    const options = await getFormOptions();
    const selectedMajoitus = validatedData.Majoitus;

    for (const majoitusId of selectedMajoitus) {
      const accommodation = options.majoitus.find((m) => m.id === majoitusId);

      if (!accommodation) {
        return NextResponse.json(
          {
            success: false,
            error: `Majoitus ei löydy: ${majoitusId}`,
          },
          { status: 400 },
        );
      }

      if (
        accommodation.available !== undefined &&
        accommodation.available <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Majoitus "${accommodation.name}" on täynnä. Päivitä sivu ja valitse toinen majoitus.`,
          },
          { status: 400 },
        );
      }
    }

    // Submit to Airtable
    const result = await submitRegistration(validatedData);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      // Zod validation error or Airtable error
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Ilmoittautuminen epäonnistui",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Odottamaton virhe" },
      { status: 500 },
    );
  }
}
