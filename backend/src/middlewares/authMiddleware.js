const { verifyToken } = require("../utils/auth");

function createAuthGuard(role) {
    return (req, res, next) => {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ error: "Authentication required" });
        }

        try {
            const decoded = verifyToken(token);
            if (decoded.role !== role) {
                return res.status(403).json({ error: "Access denied" });
            }
            req.auth = {
                id: decoded.id,
                username: decoded.username,
                role: decoded.role
            };
            next();
        } catch (err) {
            const message =
                err.name === "TokenExpiredError" ? "Session expired. Please login again" : "Invalid or expired token";
            return res.status(401).json({ error: message });
        }
    };
}

const requireAdmin = createAuthGuard("admin");
const requireUser = createAuthGuard("user");

module.exports = { requireAdmin, requireUser };
