const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        countryCode: { type: String, required: true },
        phone: { type: String, required: true },
        password: { type: String, required: true }
    },
    { timestamps: true, collection: "admins" }
);

module.exports = mongoose.model("Admin", adminSchema);
