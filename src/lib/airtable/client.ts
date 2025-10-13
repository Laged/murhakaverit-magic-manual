import type {
  AirtableField,
  AirtableListResponse,
  FormOptions,
  SignUpFormData,
} from "./types";

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";
const TABLE_NAME = "Ilmottautumiset";

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} environment variable is required`);
  }
  return value;
}

/**
 * Fetch table schema to get field options (select/multiselect choices)
 */
export async function getTableSchema(): Promise<AirtableField[]> {
  const AIRTABLE_API_KEY = getEnvVar("AIRTABLE_API_KEY");
  const AIRTABLE_BASE_ID = getEnvVar("AIRTABLE_BASE_ID");

  const url = `${AIRTABLE_API_BASE}/meta/bases/${AIRTABLE_BASE_ID}/tables`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch table schema: ${response.statusText}`);
  }

  const data = await response.json();
  const table = data.tables?.find(
    (t: { name: string }) => t.name === TABLE_NAME,
  );

  if (!table) {
    throw new Error(`Table "${TABLE_NAME}" not found`);
  }

  return table.fields;
}

/**
 * Get accommodation options from Majoitukset table
 */
async function getMajoitusOptions(): Promise<
  import("./types").MajoitusOption[]
> {
  const AIRTABLE_API_KEY = getEnvVar("AIRTABLE_API_KEY");
  const AIRTABLE_BASE_ID = getEnvVar("AIRTABLE_BASE_ID");

  const url = `${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}/${encodeURIComponent("Majoitukset")}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    cache: "no-store", // Always fetch fresh data for accommodation availability
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch accommodations: ${response.statusText}`);
  }

  const data: AirtableListResponse = await response.json();

  return data.records.map((record) => ({
    id: record.id,
    name: (record.fields.Name as string) || "Unknown",
    capacity: record.fields.Tilaa as number | undefined,
    available: record.fields.Vapaana as number | undefined,
  }));
}

/**
 * Get form options from Airtable field definitions
 */
export async function getFormOptions(): Promise<FormOptions> {
  const fields = await getTableSchema();

  const getChoices = (fieldName: string): string[] => {
    const field = fields.find((f) => f.name === fieldName);
    return field?.options?.choices?.map((c) => c.name) || [];
  };

  // Fetch accommodation options from the linked table
  const majoitusOptions = await getMajoitusOptions();

  return {
    ruokavalio: getChoices("Ruokavalio"),
    kuljetus: getChoices("Kuljetus"),
    pelikiinnostus: getChoices("Pelikiinnostus"),
    tulenPaikalle: getChoices("Tulen paikalle"),
    majoitus: majoitusOptions,
  };
}

/**
 * Submit a new registration to Airtable
 */
export async function submitRegistration(
  data: SignUpFormData,
): Promise<{ success: true; recordId: string }> {
  const AIRTABLE_API_KEY = getEnvVar("AIRTABLE_API_KEY");
  const AIRTABLE_BASE_ID = getEnvVar("AIRTABLE_BASE_ID");

  const url = `${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        Nimi: data.Nimi,
        Maili: data.Maili,
        Puhnro: data.Puhnro,
        Ruokavalio: data.Ruokavalio,
        Kuljetus: data.Kuljetus,
        Pelikiinnostus: data.Pelikiinnostus,
        Roolipelikiinnostus: data.Roolipelikiinnostus,
        "Tulen paikalle": data["Tulen paikalle"],
        Allergiat: data.Allergiat || "",
        Terveyshuomioita: data.Terveyshuomioita || "",
        Majoitukset: data.Majoitukset || "",
        Majoitus: data.Majoitus, // Array of record IDs for linked records
        Laskutustiedot: data.Laskutustiedot || "",
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to submit: ${response.statusText}`,
    );
  }

  const result = await response.json();
  return { success: true, recordId: result.id };
}

/**
 * Get all records (for checking availability if needed)
 */
export async function getRecords(): Promise<AirtableListResponse> {
  const AIRTABLE_API_KEY = getEnvVar("AIRTABLE_API_KEY");
  const AIRTABLE_BASE_ID = getEnvVar("AIRTABLE_BASE_ID");

  const url = `${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    next: { revalidate: 60 }, // Cache for 1 minute
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch records: ${response.statusText}`);
  }

  return response.json();
}
