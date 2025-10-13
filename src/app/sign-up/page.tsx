import Card from "@/components/GraniittiSauna/Card";
import styles from "@/components/GraniittiSauna/GraniittiSauna.module.css";
import SignUpForm from "@/components/SignUpForm";
import { getFormOptions } from "@/lib/airtable/client";
import type { FormOptions } from "@/lib/airtable/types";

export default async function SignUpPage() {
  let options: FormOptions;

  try {
    options = await getFormOptions();
  } catch (error) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card theme="light">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Virhe lomakkeen latauksessa
            </h1>
            <p className="text-gray-600">
              {error instanceof Error
                ? error.message
                : "Yritä päivittää sivu tai ota yhteyttä järjestäjiin."}
            </p>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className={styles.cardWrapper}>
        <Card theme="light">
          <div className="flex flex-col gap-2">
            <header className={styles.header}>
              <h2 className={styles.heading}>Graniittimatkat 05/2026</h2>
              <p className={styles.tagline}>
                Graniittimatkan seikkailut kutsuvat jälleen 7.5. - 10.5.2026!
              </p>
              <div className={styles.descriptionContainer}>
                <p className={styles.description}>
                  Olet jo toivottavsti Whatsapp-ryhmässämme ja saanut tiedot
                  tapahtumasta. Hintaa tulee Majoitukset+sauna+ruuat =
                  ~250e/hlö. Toistaiseksi jokainen osallistuja joutuu
                  ilmoittautumaan erikseen. Laita siellä viestiä, jos
                  ilmoittautumisesta herää kysymyksiä näiden lisäksi:
                </p>
                <p className={styles.description}>
                  Puumajoja on 4kpl, jokaiseen mahtuu 3hlö, mutta on OK varata
                  niitä kahdestaankin.
                </p>
                <p className={styles.description}>
                  Glamping telttoja on 3kpl, jokaiseen mahtuu 2hlö.
                </p>
                <p className={styles.description}>
                  Hinta arviolta majoitus+sauna+ruoka = ~250e/hlö.
                </p>
              </div>
            </header>
            <SignUpForm options={options} />
          </div>
        </Card>
      </div>
    </main>
  );
}
