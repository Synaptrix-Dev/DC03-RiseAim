import jwt from "jsonwebtoken";

// Define public routes outside verifyToken
const publicRoutes = [
  "/register",
  "/login",
  "/get-subscription-plans",
  "/get-user-ads",
  "/get-user-ad-details",
];

const verifyToken = (req, res, next) => {
  // Bypass token verification for public routes
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Initialize response flags
    const responseFlags = {
      isUser: false,
      isAdmin: false,
      isActive: decoded.isActive,
      accessDenied: false
    };

    // Check user/admin status and activity
    if (decoded.isAdmin) {
      // User is an admin
      responseFlags.isAdmin = true;
      if (!decoded.isActive) {
        responseFlags.accessDenied = true;
        return res.status(403).json({
          message: "Access denied. Admin account is inactive",
          flags: responseFlags
        });
      }
    } else {
      // User is a regular user
      responseFlags.isUser = true;
      if (!decoded.isActive) {
        responseFlags.accessDenied = true;
        return res.status(403).json({
          message: "Access denied. User account is inactive",
          flags: responseFlags
        });
      }
    }

    // Set req.user for use in controllers
    req.user = {
      id: decoded.id,
      email: decoded.email,
      fullName: decoded.fullName,
      isActive: decoded.isActive,
      isAdmin: decoded.isAdmin
    };

    // Attach flags to request for use in controllers
    req.authFlags = responseFlags;

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

export default verifyToken;
