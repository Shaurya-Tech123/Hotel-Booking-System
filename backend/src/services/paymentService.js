const crypto = require("crypto");
const env = require("../config/env");

function createOrder({ amount, currency = "INR" }) {
    const provider = env.stripeSecretKey ? "STRIPE" : env.razorpayKeyId ? "RAZORPAY" : "MANUAL";
    const orderId = `${provider.toLowerCase()}_order_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    return {
        provider,
        orderId,
        amount,
        currency,
        mode: provider === "MANUAL" ? "SIMULATED" : "LIVE_READY"
    };
}

function createRefund({ transactionId, amount }) {
    return {
        refundId: `refund_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
        transactionId,
        amount,
        status: "PROCESSED"
    };
}

module.exports = { createOrder, createRefund };
