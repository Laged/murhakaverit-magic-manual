import { z } from "zod";

// Airtable field schema - matches the actual Airtable fields
export const SignUpFormSchema = z.object({
  Nimi: z.string().min(1, "Nimi vaaditaan"),
  Maili: z.string().email("Virheellinen sähköpostiosoite"),
  Puhnro: z.string().min(1, "Puhelinnumero vaaditaan"),
  Ruokavalio: z.array(z.string()).min(1, "Valitse vähintään yksi vaihtoehto"),
  Kuljetus: z.string().min(1, "Kuljetus vaaditaan"),
  Roolipelikiinnostus: z.boolean().optional(),
  Pelikiinnostus: z
    .array(z.string())
    .min(1, "Valitse vähintään yksi vaihtoehto"),
  "Tulen paikalle": z.string().min(1, "Valinta vaaditaan"),
  Allergiat: z.string().optional(),
  Terveyshuomioita: z.string().optional(),
  Majoitushuomioita: z.string().optional(), // Single line text field
  Majoitus: z.array(z.string()).min(1, "Majoitus vaaditaan"), // Linked record IDs
  Laskutustiedot: z.string().optional(),
});

export type SignUpFormData = z.infer<typeof SignUpFormSchema>;

// Airtable API response types
export interface AirtableField {
  id: string;
  name: string;
  type: string;
  options?: {
    choices?: Array<{
      id: string;
      name: string;
      color?: string;
    }>;
  };
}

export interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
}

export interface AirtableListResponse {
  records: AirtableRecord[];
  offset?: string;
}

export interface MajoitusOption {
  id: string;
  name: string;
  capacity?: number;
  available?: number;
}

export interface FormOptions {
  ruokavalio: string[];
  kuljetus: string[];
  pelikiinnostus: string[];
  tulenPaikalle: string[];
  majoitus: MajoitusOption[]; // Linked records from Majoitukset table
}
