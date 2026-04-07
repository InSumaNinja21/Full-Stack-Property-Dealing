/**
 * @param {string[]} allowedRoles — e.g. ["seller"]
 * Run after authMiddleware so req.user is set from JWT.
 */
const roleMiddleware = (allowedRoles) => (req, res, next) => {
  const raw = req.user?.role;
  const role = raw === "seller" ? "seller" : "buyer";

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
};

module.exports = roleMiddleware;
