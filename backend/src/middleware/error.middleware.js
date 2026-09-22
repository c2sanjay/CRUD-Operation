function errorMiddleware(err, req, res, next) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Invalid loan data",
      error: err.message,
    });
  }

  const status = err.status || err.statusCode || 500;
  const safeToExpose =
    err.expose === true || (status < 500 && err.expose !== false);
  const fallback = status === 404 ? "Not found" : "Internal server error";

  res.status(status).json({
    message: safeToExpose && err.message ? err.message : fallback,
  });
}

module.exports = errorMiddleware;
