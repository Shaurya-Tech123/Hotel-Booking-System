const dotenv = require("dotenv");

dotenv.config();

module.exports = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 3000),
    mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hotel_management",
    jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
    refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || "7d",
    clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || ""
};
