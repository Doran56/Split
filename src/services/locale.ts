export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function round1(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Rounds to the nearest multiple of `step` (e.g. roundToNearest(487, 10) === 490). */
export function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Parses a French-locale decimal string (comma or dot separator) into a number.
 * Returns null when the input isn't a valid single number (e.g. multiple separators, letters).
 */
export function parseLocaleNumber(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;
  if (!/^\d+([.,]\d*)?$/.test(trimmed)) return null;

  const normalized = trimmed.replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

export function formatCurrencyEUR(amount: number): string {
  return currencyFormatter.format(amount);
}

const percentFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}
