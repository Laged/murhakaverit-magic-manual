"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./PasswordDialog.module.css";

interface PasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PasswordDialog({
  isOpen,
  onClose,
}: PasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const passwordId = `password-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/check-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/sign-up");
      } else {
        setError(data.error || "Väärä salasana");
        setPassword("");
      }
    } catch {
      setError("Verkkovirhe. Yritä uudelleen.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <button
      type="button"
      className={styles.overlay}
      onClick={onClose}
      aria-label="Close dialog"
    >
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className={styles.title}>VIP Kutsutapahtuma</h2>
        <p className={styles.description}>Anna salasana jatkaaksesi.</p>

        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor={passwordId} className={styles.label}>
              Salasana
            </label>
            <input
              id={passwordId}
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <div className={styles.errorContainer}>
              {error && <div className={styles.error}>{error}</div>}
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={onClose}
              disabled={isLoading}
            >
              Peruuta
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={isLoading || !password}
            >
              {isLoading ? "Tarkistetaan..." : "Vahvista"}
            </button>
          </div>
        </form>
      </div>
    </button>,
    document.body,
  );
}
