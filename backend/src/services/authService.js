const bcrypt = require("bcryptjs");
const { signToken } = require("../utils/auth");
const {
    normalizeRegistrationInput,
    validateRegistration,
    normalizeLoginInput,
    validateLogin
} = require("../utils/validators");

const SALT_ROUNDS = 12;

async function registerAccount(Model, role, req, res) {
    const data = normalizeRegistrationInput(req.body);
    const errors = validateRegistration(data);
    if (errors.length) {
        return res.status(400).json({ error: errors.join(". "), errors });
    }

    const existingUsername = await Model.findOne({ username: data.username });
    if (existingUsername) {
        return res.status(409).json({ error: "Username already exists" });
    }

    const existingEmail = await Model.findOne({ email: data.email });
    if (existingEmail) {
        return res.status(409).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    const account = await Model.create({
        username: data.username,
        email: data.email,
        countryCode: data.countryCode,
        phone: data.phone,
        password: hashedPassword
    });

    const token = signToken({
        id: account._id,
        username: account.username,
        role
    });

    const profile = {
        id: account._id.toString(),
        username: account.username,
        email: account.email,
        countryCode: account.countryCode,
        phone: account.phone
    };

    return res.status(201).json({
        message: `${role === "admin" ? "Admin" : "User"} registered successfully`,
        token,
        [role === "admin" ? "admin" : "user"]: profile
    });
}

async function loginAccount(Model, role, req, res) {
    const data = normalizeLoginInput(req.body);
    const errors = validateLogin(data);
    if (errors.length) {
        return res.status(400).json({ error: errors.join(". "), errors });
    }

    const account = await Model.findOne({ username: data.username });
    if (!account) {
        return res.status(401).json({ error: "Username not found" });
    }

    const passwordMatch = await bcrypt.compare(data.password, account.password);
    if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid password" });
    }

    const token = signToken({
        id: account._id,
        username: account.username,
        role
    });

    const profile = {
        id: account._id.toString(),
        username: account.username,
        email: account.email
    };

    return res.json({
        message: "Login successful",
        token,
        [role === "admin" ? "admin" : "user"]: profile
    });
}

module.exports = { registerAccount, loginAccount };
