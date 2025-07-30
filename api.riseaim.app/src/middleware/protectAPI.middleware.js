const apiKeyMiddleware = (req, res, next) => {
  const apiKey = process.env.API_KEY;
  const providedKey = req.headers["x-api-key"];

  if (providedKey && providedKey === apiKey) {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Unauthorized" });
  }
};

export default apiKeyMiddleware;
