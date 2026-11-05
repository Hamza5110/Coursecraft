export function formatPrice(price) {
  const value = Number(price);
  if (!Number.isFinite(value) || value <= 0) return "Free";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
