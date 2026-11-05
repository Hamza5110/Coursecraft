export function notFoundHandler(_req, res) {
  res.status(404).json({ success: false, message: "Route not found" });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || err.status || 500;

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `${field} already in use`,
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message || "Validation failed",
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid id",
    });
  }

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body",
    });
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  } else if (status >= 500) {
    console.error(err.message);
  }

  const message =
    status >= 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Request failed";

  res.status(status).json({ success: false, message });
}
