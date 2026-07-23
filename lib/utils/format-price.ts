const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return inrFormatter.format(value);
}
