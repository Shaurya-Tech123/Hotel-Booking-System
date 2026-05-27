const User = require("../models/User");
const { registerAccount, loginAccount } = require("../services/authService");

async function register(req, res) {
    return registerAccount(User, "user", req, res);
}

async function login(req, res) {
    return loginAccount(User, "user", req, res);
}

module.exports = { register, login };
