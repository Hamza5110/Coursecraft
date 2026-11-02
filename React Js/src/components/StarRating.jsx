export default function StarRating({
  value = 0,
  onChange,
  size = "md",
  readOnly = false,
}) {
  const sizeClass = size === "sm" ? "text-base" : "text-2xl";
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`inline-flex gap-1 ${sizeClass}`} role="img" aria-label={`${value} out of 5 stars`}>
      {stars.map((star) => {
        const filled = star <= value;
        if (readOnly) {
          return (
            <span
              key={star}
              className={filled ? "text-amber-500" : "text-gray-300"}
            >
              ★
            </span>
          );
        }
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className={`${filled ? "text-amber-500" : "text-gray-300"} hover:text-amber-400`}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
