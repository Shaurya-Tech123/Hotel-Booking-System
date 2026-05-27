const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const { requireAdmin } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();

router.get("/dashboard", requireAdmin, asyncHandler(analyticsController.getDashboardAnalytics));

module.exports = router;
