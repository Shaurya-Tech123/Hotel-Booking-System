const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const env = require("../config/env");
const { User, RefreshToken, AuditLog } = require("../models");
const { signAccessToken, signRefreshToken, hashToken } = require("../utils/auth");

const authSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
const registerSchema = authSchema.extend({ name: z.string().min(2), role: z.enum(["ADMIN", "CUSTOMER"]).optional() });

async function register(req, res) {
    const parsed = registerSchema.parse(req.body);
    const exists = await User.findOne({ email: parsed.email });
    if (exists) return res.status(409).json({ error: "Email already exists" });
    const passwordHash = await bcrypt.hash(parsed.password, 10);
    const user = await User.create({ name: parsed.name, email: parsed.email, role: parsed.role || "CUSTOMER", passwordHash });
    await AuditLog.create({ actorId: user._id, action: "USER_REGISTERED", meta: { role: user.role } });
    return res.status(201).json({ id: user._id, email: user.email, role: user.role });
}

async function login(req, res) {
    const parsed = authSchema.parse(req.body);
    const user = await User.findOne({ email: parsed.email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    const payload = jwt.decode(refreshToken);
    await RefreshToken.create({
        userId: user._id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(payload.exp * 1000)
    });
    await AuditLog.create({ actorId: user._id, action: "USER_LOGGED_IN", meta: {} });
    return res.json({ accessToken, refreshToken, user: { id: user._id, email: user.email, role: user.role, name: user.name } });
}

async function refresh(req, res) {
    const token = req.body.refreshToken;
    if (!token) return res.status(401).json({ error: "Refresh token required" });
    let payload;
    try {
        payload = jwt.verify(token, env.jwtSecret);
    } catch {
        return res.status(401).json({ error: "Invalid refresh token" });
    }
    const exists = await RefreshToken.findOne({ tokenHash: hashToken(token), userId: payload.sub });
    if (!exists) return res.status(401).json({ error: "Refresh token revoked" });
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });
    return res.json({ accessToken: signAccessToken(user) });
}

module.exports = { register, login, refresh };
