export function formatCash(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const formatted = (absolute / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${formatted}`;
}

export function dollarsToCents(value: string | number): number {
  const amount = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(amount)) {
    throw new Error("Invalid amount");
  }
  return Math.round(amount * 100);
}
