"use client";

import { useId, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import type { FormOptions } from "@/lib/airtable/types";
import styles from "./SignUpForm.module.css";

interface SignUpFormProps {
  options: FormOptions;
}

export default function SignUpForm({
  options: initialOptions,
}: SignUpFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [options, _setOptions] = useState<FormOptions>(initialOptions);
  const [_isRefreshingCapacity, _setIsRefreshingCapacity] = useState(false);

  // Generate unique IDs for form fields
  const mailiId = useId();
  const puhnroId = useId();
  const nimiId = useId();
  const ruokavalio = useId();
  const allergiatId = useId();
  const kuljetusId = useId();
  const pelikiinnostusId = useId();
  const roolipeliId = useId();
  const tulenPaikalleId = useId();
  const majoitusId = useId();
  const huomioId = useId();
  const terveysId = useId();

  const [formData, setFormData] = useState({
    Nimi: "",
    Maili: "",
    Puhnro: "",
    Ruokavalio: [] as string[],
    Kuljetus: "",
    Pelikiinnostus: [] as string[],
    Roolipelikiinnostus: false,
    "Tulen paikalle": "",
    Allergiat: "",
    Terveyshuomioita: "",
    Majoitukset: "",
    Majoitus: [] as string[],
    "Osoitetiedot laskusta varten": "",
    Majoitushuomioita: "",
  });

  const handleCheckboxChange = (
    field: "Ruokavalio" | "Pelikiinnostus" | "Majoitus",
    value: string,
  ) => {
    if (field === "Majoitus") {
      setFormData((prev) => ({
        ...prev,
        [field]: [value],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: prev[field].includes(value)
          ? prev[field].filter((v) => v !== value)
          : [...prev[field], value],
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.Nimi) newErrors.Nimi = "Nimi vaaditaan";
    if (!formData.Maili) newErrors.Maili = "Maili vaaditaan";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Maili))
      newErrors.Maili = "Virheellinen sähköpostiosoite";
    if (!formData.Puhnro) newErrors.Puhnro = "Puhelinnumero vaaditaan";
    if (formData.Ruokavalio.length === 0)
      newErrors.Ruokavalio = "Valitse vähintään yksi vaihtoehto";
    if (!formData.Kuljetus) newErrors.Kuljetus = "Kuljetus vaaditaan";
    if (formData.Pelikiinnostus.length === 0)
      newErrors.Pelikiinnostus = "Valitse vähintään yksi vaihtoehto";
    if (!formData["Tulen paikalle"])
      newErrors["Tulen paikalle"] = "Valinta vaaditaan";
    if (formData.Majoitus.length === 0)
      newErrors.Majoitus = "Majoitus vaaditaan";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Tarkista lomakkeen tiedot");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        toast.success("Ilmoittautuminen onnistui!");
      } else {
        toast.error(data.error || "Ilmoittautuminen epäonnistui");
      }
    } catch {
      toast.error("Verkkovirhe. Yritä uudelleen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData({
      Nimi: "",
      Maili: "",
      Puhnro: "",
      "Osoitetiedot laskusta varten": "",
      Ruokavalio: [],
      Kuljetus: "",
      Pelikiinnostus: [],
      Roolipelikiinnostus: false,
      "Tulen paikalle": "",
      Allergiat: "",
      Majoitukset: "",
      Majoitus: [],
      Terveyshuomioita: "",
      Majoitushuomioita: "",
    });
    setErrors({});
  };

  if (isSuccess) {
    // Get readable names for Majoitus (convert IDs to names)
    const majoitusNames = formData.Majoitus.map((id) => {
      const option = options.majoitus.find((opt) => opt.id === id);
      return option?.name || id;
    }).join(", ");

    return (
      <div className={styles.successContainer}>
        <div className={styles.successMessage}>
          <h2 className={styles.successTitle}>Kiitos ilmoittautumisesta!</h2>
          <p className={styles.successText}>
            Ilmoittautumisesi on vastaanotettu. Saat lisätietoja sähköpostitse
            lähempänä tapahtumaa.
          </p>
        </div>

        <div className={styles.summarySection}>
          <h3 className={styles.summaryTitle}>Yhteenveto</h3>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Nimi:</span>
              <span className={styles.summaryValue}>{formData.Nimi}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Maili:</span>
              <span className={styles.summaryValue}>{formData.Maili}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Puhelinnumero:</span>
              <span className={styles.summaryValue}>{formData.Puhnro}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Ruokavalio:</span>
              <span className={styles.summaryValue}>
                {formData.Ruokavalio.join(", ")}
              </span>
            </div>
            {formData.Allergiat && (
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Allergiat:</span>
                <span className={styles.summaryValue}>
                  {formData.Allergiat}
                </span>
              </div>
            )}
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Kuljetus:</span>
              <span className={styles.summaryValue}>{formData.Kuljetus}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Pelikiinnostus:</span>
              <span className={styles.summaryValue}>
                {formData.Pelikiinnostus.join(", ")}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Tulen paikalle:</span>
              <span className={styles.summaryValue}>
                {formData["Tulen paikalle"]}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Majoitus:</span>
              <span className={styles.summaryValue}>{majoitusNames}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Nimi */}
        <div className={styles.field}>
          <div className={styles.fieldTitle}>
            <label htmlFor={nimiId} className={styles.label}>
              Nimi <span className={styles.required}>*</span>
            </label>
            <div className={styles.errorContainer}>
              {errors.Nimi && (
                <span className={styles.error}>{errors.Nimi}</span>
              )}
            </div>
          </div>
          <input
            id={nimiId}
            type="text"
            className={styles.input}
            value={formData.Nimi}
            placeholder="Etunimi Sukunimi"
            onChange={(e) => setFormData({ ...formData, Nimi: e.target.value })}
            disabled={isSubmitting}
          />
        </div>

        {/* Maili */}
        <div className={styles.field}>
          <div className={styles.fieldTitle}>
            <label htmlFor={mailiId} className={styles.label}>
              Maili <span className={styles.required}>*</span>
            </label>
            <div className={styles.errorContainer}>
              {errors.Maili && (
                <span className={styles.error}>{errors.Maili}</span>
              )}
            </div>
          </div>
          <input
            id={mailiId}
            type="email"
            className={styles.input}
            value={formData.Maili}
            placeholder="osote@mail.com"
            onChange={(e) =>
              setFormData({ ...formData, Maili: e.target.value })
            }
            disabled={isSubmitting}
          />
        </div>

        {/* Puhelinnumero */}
        <div className={styles.field}>
          <div className={styles.fieldTitle}>
            <label htmlFor={puhnroId} className={styles.label}>
              Puhelinnumero <span className={styles.required}>*</span>
            </label>
            <div className={styles.errorContainer}>
              {errors.Puhnro && (
                <span className={styles.error}>{errors.Puhnro}</span>
              )}
            </div>
          </div>
          <input
            id={puhnroId}
            type="tel"
            className={styles.input}
            value={formData.Puhnro}
            placeholder="+358123456789"
            onChange={(e) =>
              setFormData({ ...formData, Puhnro: e.target.value })
            }
            disabled={isSubmitting}
          />
        </div>

        {/* Ruokavalio */}
        <div className={styles.field}>
          <div className={styles.fieldTitle}>
            <label htmlFor={ruokavalio} className={styles.label}>
              Ruokavalio <span className={styles.required}>*</span>
            </label>
            <div className={styles.errorContainer}>
              {errors.Ruokavalio && (
                <span className={styles.error}>{errors.Ruokavalio}</span>
              )}
            </div>
          </div>
          <div className={styles.checkboxGroup}>
            {options.ruokavalio.map((option) => (
              <div key={option} className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  id={`ruokavalio-${option}`}
                  className={styles.checkbox}
                  checked={formData.Ruokavalio.includes(option)}
                  onChange={() => handleCheckboxChange("Ruokavalio", option)}
                  disabled={isSubmitting}
                />
                <label
                  htmlFor={`ruokavalio-${option}`}
                  className={styles.checkboxLabel}
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Allergiat */}
        <div className={styles.field}>
          <label htmlFor={allergiatId} className={styles.label}>
            Allergiat
          </label>
          <textarea
            id={allergiatId}
            className={styles.textarea}
            value={formData.Allergiat}
            onChange={(e) =>
              setFormData({ ...formData, Allergiat: e.target.value })
            }
            disabled={isSubmitting}
          />
        </div>

        {/* Kuljetus */}
        <div className={styles.field}>
          <div className={styles.fieldTitle}>
            <label htmlFor={kuljetusId} className={styles.label}>
              Kuljetus <span className={styles.required}>*</span>
            </label>
            <div className={styles.errorContainer}>
              {errors.Kuljetus && (
                <span className={styles.error}>{errors.Kuljetus}</span>
              )}
            </div>
          </div>
          <select
            id={kuljetusId}
            className={styles.select}
            value={formData.Kuljetus}
            onChange={(e) =>
              setFormData({ ...formData, Kuljetus: e.target.value })
            }
            disabled={isSubmitting}
          >
            <option value="">Valitse...</option>
            {options.kuljetus.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Pelikiinnostus */}
        <div className={styles.field}>
          <div className={styles.fieldTitle}>
            <label htmlFor={pelikiinnostusId} className={styles.label}>
              Pelikiinnostus <span className={styles.required}>*</span>
            </label>
            <div className={styles.errorContainer}>
              {errors.Pelikiinnostus && (
                <span className={styles.error}>{errors.Pelikiinnostus}</span>
              )}
            </div>
          </div>
          <div className={styles.checkboxGroup}>
            {options.pelikiinnostus.map((option) => (
              <div key={option} className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  id={`pelikiinnostus-${option}`}
                  className={styles.checkbox}
                  checked={formData.Pelikiinnostus.includes(option)}
                  onChange={() =>
                    handleCheckboxChange("Pelikiinnostus", option)
                  }
                  disabled={isSubmitting}
                />
                <label
                  htmlFor={`pelikiinnostus-${option}`}
                  className={styles.checkboxLabel}
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Roolipelikiinnostus */}
        <div className={styles.field}>
          <div className={styles.fieldTitle}>
            <label htmlFor={roolipeliId} className={styles.label}>
              Roolipelaan mielelläni <span className={styles.required}>*</span>
            </label>
            <div className={styles.errorContainer}>
              {errors.Roolipelikiinnostus && (
                <span className={styles.error}>
                  {errors.Roolipelikiinnostus}
                </span>
              )}
            </div>
          </div>
          <div className={styles.checkboxItem}>
            <input
              type="checkbox"
              id={`roolipelikiinnostus`}
              className={styles.checkbox}
              checked={formData.Roolipelikiinnostus}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  Roolipelikiinnostus: e.target.checked,
                })
              }
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Tulen paikalle */}
        <div className={styles.field}>
          <div className={styles.fieldTitle}>
            <label htmlFor={tulenPaikalleId} className={styles.label}>
              Tulen paikalle <span className={styles.required}>*</span>
            </label>
            <div className={styles.errorContainer}>
              {errors["Tulen paikalle"] && (
                <span className={styles.error}>{errors["Tulen paikalle"]}</span>
              )}
            </div>
          </div>
          <select
            id={tulenPaikalleId}
            className={styles.select}
            value={formData["Tulen paikalle"]}
            onChange={(e) =>
              setFormData({ ...formData, "Tulen paikalle": e.target.value })
            }
            disabled={isSubmitting}
          >
            <option value="">Valitse...</option>
            {options.tulenPaikalle.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Majoitus */}
        <div className={styles.field}>
          <div className={styles.fieldTitle}>
            <label htmlFor={majoitusId} className={styles.label}>
              Majoitus <span className={styles.required}>*</span>
            </label>
            <div className={styles.errorContainer}>
              {errors.Majoitus && (
                <span className={styles.error}>{errors.Majoitus}</span>
              )}
            </div>
          </div>
          <div className={styles.checkboxGroup}>
            {options.majoitus.map((option) => {
              const availableText =
                option.available !== undefined
                  ? ` (${option.available}/${option.capacity || "?"} vapaana)`
                  : "";
              const isAvailable =
                option.available === undefined || option.available > 0;

              return (
                <div key={option.id} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id={`majoitus-${option.id}`}
                    className={styles.radiobox}
                    checked={formData.Majoitus.includes(option.id)}
                    onChange={() => handleCheckboxChange("Majoitus", option.id)}
                    disabled={isSubmitting || !isAvailable}
                  />
                  <label
                    htmlFor={`majoitus-${option.id}`}
                    className={styles.checkboxLabel}
                    style={{
                      opacity: isAvailable ? 1 : 0.5,
                      textDecoration: isAvailable ? "none" : "line-through",
                    }}
                  >
                    {option.name}
                    {availableText}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Majoitushuomioita */}
        <div className={styles.field}>
          <label htmlFor={huomioId} className={styles.label}>
            Majoitushuomioita
          </label>
          <textarea
            id={terveysId}
            className={styles.textarea}
            value={formData.Majoitushuomioita}
            placeholder="Nukun missä tahansa, paitsi Villen pikkulusikkana. Iso lusikka OK."
            onChange={(e) =>
              setFormData({
                ...formData,
                Majoitushuomioita: e.target.value,
              })
            }
            disabled={isSubmitting}
          />
        </div>

        {/* Terveydellisiä huomioita */}
        <div className={styles.field}>
          <label htmlFor={terveysId} className={styles.label}>
            Terveydellisiä huomioita
          </label>
          <textarea
            id={terveysId}
            className={styles.textarea}
            value={formData.Terveyshuomioita}
            placeholder="Järjestäjille tiedoksi: pelkään pimeää"
            onChange={(e) =>
              setFormData({ ...formData, Terveyshuomioita: e.target.value })
            }
            disabled={isSubmitting}
          />
        </div>

        {/* Buttons */}
        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={handleClear}
            disabled={isSubmitting}
          >
            Tyhjennä lomake
          </button>
          <button
            type="submit"
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Lähetetään..." : "Lähetä"}
          </button>
        </div>
      </form>
    </>
  );
}
