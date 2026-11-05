export default function Alert({
  type = "error",
  children,
  className = "",
  onDismiss,
}) {
  if (!children) return null;

  const styles =
    type === "success"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : type === "info"
        ? "bg-sky-50 text-sky-800 border-sky-200"
        : "bg-red-50 text-red-800 border-red-200";

  return (
    <div
      role="alert"
      className={`rounded-lg border px-3 py-2 text-sm ${styles} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>{children}</div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 text-current/70 hover:text-current"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
