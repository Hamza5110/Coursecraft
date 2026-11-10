const variants = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400",
  secondary:
    "bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400",
  ghost: "bg-transparent text-blue-700 hover:bg-blue-50",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5",
};

export default function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  disabled,
  children,
  type,
  ...props
}) {
  const isButton = Comp === "button";
  return (
    <Comp
      type={isButton ? type || "button" : undefined}
      disabled={isButton ? disabled || loading : undefined}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? "Please wait…" : children}
    </Comp>
  );
}
