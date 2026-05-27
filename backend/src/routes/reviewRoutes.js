const express = require("express");
const reviewController = require("../controllers/reviewController");
const { requireUser } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();

router.get("/hotel/:hotelId/stats", asyncHandler(reviewController.getReviewStats));
router.get("/hotel/:hotelId", asyncHandler(reviewController.getHotelReviews));
router.post("/", requireUser, asyncHandler(reviewController.addReview));

module.exports = router;
