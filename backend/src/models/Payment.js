const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: "INR" },
        status: { type: String, enum: ["paid", "pending", "failed"], default: "paid" },
        method: { type: String, default: "direct" }
    },
    { timestamps: true, collection: "payments" }
);

module.exports = mongoose.model("Payment", paymentSchema);
