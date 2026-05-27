const Admin = require("../models/Admin");
const { registerAccount, loginAccount } = require("../services/authService");

async function register(req, res) {
    return registerAccount(Admin, "admin", req, res);
}

async function login(req, res) {
    return loginAccount(Admin, "admin", req, res);
}

module.exports = { register, login };
