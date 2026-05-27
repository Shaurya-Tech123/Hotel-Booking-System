const express = require("express");
const adminAuthRoutes = require("./adminAuthRoutes");
const userAuthRoutes = require("./userAuthRoutes");
const hotelRoutes = require("./hotelRoutes");
const bookingRoutes = require("./bookingRoutes");
const reviewRoutes = require("./reviewRoutes");
const uploadRoutes = require("./uploadRoutes");
const analyticsRoutes = require("./analyticsRoutes");

const router = express.Router();

router.use("/admin/auth", adminAuthRoutes);
router.use("/admin/uploads", uploadRoutes);
router.use("/admin/analytics", analyticsRoutes);
router.use("/user/auth", userAuthRoutes);
router.use("/hotels", hotelRoutes);
router.use("/bookings", bookingRoutes);
router.use("/reviews", reviewRoutes);

module.exports = router;
