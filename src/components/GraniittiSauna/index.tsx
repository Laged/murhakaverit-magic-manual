"use client";

import { useState } from "react";
import PasswordDialog from "@/components/PasswordDialog";
import Card from "./Card";
import styles from "./GraniittiSauna.module.css";

type GraniittiSaunaTheme = "light" | "dark";

interface GraniittiSaunaProps {
  theme?: GraniittiSaunaTheme;
}

export default function GraniittiSauna({
  theme = "light",
}: GraniittiSaunaProps) {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const sectionClass = `${styles.section} ${
    theme === "dark" ? styles.sectionDark : styles.sectionLight
  }`;

  return (
    <section className={sectionClass}>
      <div className={styles.cardWrapper}>
        <Card theme={theme}>
          <div className="flex flex-col gap-8">
            <header className={styles.header}>
              <h2 className={styles.heading}>Graniittimatkat 05/2026</h2>
              <p className={styles.tagline}>
                Graniittimatkan seikkailut kutsuvat jälleen 7.5. - 10.5.2026!
              </p>
            </header>

            <div className={styles.description}>
              <p>
                Kaipaatko silmiä siristäviä löylyjä graniittisaunassa,
                kutkuttavia mysteereitä ja vapaat kädet tehdä jotakin todella,
                siis TODELLA, peruuttamatonta? Olitpa sitten vanha ja
                päättäväinen tekijä, joka yhä yrittää päästää Faaraon kirouksen
                valloilleen, tai uusi ja vähän liian innokas sielu, joka janoaa
                Kaken ylistettyä tomaatti-sellerisoppaa – me lupaamme sinulle
                jotain aivan uskomatonta. Uskomattoman hyvää…tai pahaa… sen
                päätät sinä.
              </p>

              <p>
                Suuntaamme jälleen sinne, missä itse pahuus juurtaa juurensa:
                idylliseen ja viattomalta vaikuttavaan{" "}
                <a
                  href="https://www.storfinnhova.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  Storfinnhova Gårdiin
                </a>
                . Yleisön painostuksesta (ja omien kierojen mielihalujemme
                takia) aloitamme rituaalit jo torstaina ja sunnuntaina aamun
                sarastaessa laskemme rivejä josko joku on vielä hengissä.
              </p>

              <p>
                Alkoiko pelottamaan vai mitä vielä odotat..? Tartu tähän
                tilaisuuteen ja hyppää mukaan täyttämällä ilmoittautumislomake
                alapuolelta. Nähdään Storfinnhovassa!
              </p>

              <p className={styles.highlight}>
                <strong>Vinkki:</strong> Mikäli mielit taistella kynsin ja
                hampain metsäkylän tunnelmallisiin puumökkeihin tai vaadit
                elämääsi glamouria ja luksusta glamping-telttojen muodossa,
                olethan ripeä. Parhaat paikat viedään käsistä ensimmäisille
                ilmottautujille.
              </p>

              <p className={styles.important}>
                <strong>Tärkeää:</strong> Tapahtuma on vain kutsutuille, eli
                olet todennäköisesti jo Whatsapp-ryhmässämme. Kiinnitäthän
                kuitenkin erityistä huomiota siihen, että kaikki tietosi ovat
                oikein lomaketta täyttäessäsi. Laita viestiä järjestäjille, jos
                jokin menee pieleen.
              </p>
            </div>

            <div className={styles.buttonWrap}>
              <button
                type="button"
                className={styles.button}
                onClick={() => setIsPasswordDialogOpen(true)}
              >
                Ilmoittaudu tästä!
              </button>
            </div>
          </div>
        </Card>
      </div>

      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
      />
    </section>
  );
}
