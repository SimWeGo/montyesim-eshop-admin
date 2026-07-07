import { DefaultCurrency } from "../vairables/EnumData";

/**
 * Formatage monétaire des pages affiliation. Locale fr-FR figée (espace
 * milliers, virgule décimale) — les LIBELLÉS de l'app restent en anglais,
 * seul le format des nombres est fr-FR (clientèle SimWeGo francophone).
 *
 * La devise vient TOUJOURS de la donnée : ledger et payouts portent
 * `currency` explicitement (CDC §7.2, jamais supposée EUR) —
 * DefaultCurrency (VITE_CURRENCY_DEFAULT) n'est qu'un repli d'affichage.
 */
export const formatCurrency = (amount, currency = DefaultCurrency) => {
  const value = Number(amount);
  if (amount === null || amount === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || DefaultCurrency,
    }).format(value);
  } catch {
    // Code devise inconnu d'Intl → repli brut plutôt qu'un crash de page
    return `${value.toFixed(2)} ${currency || ""}`.trim();
  }
};

/** Les montants payout/ledger transitent en CENTIMES (CDC §7.2). */
export const formatCents = (cents, currency = DefaultCurrency) =>
  formatCurrency(Number(cents ?? 0) / 100, currency);

/** Taux P/S/N/M : coupe les artefacts flottants (22.000000000000004). */
export const formatRate = (rate) =>
  rate === null || rate === undefined || Number.isNaN(Number(rate))
    ? "N/A"
    : `${Number.parseFloat(Number(rate).toFixed(4))}%`;
