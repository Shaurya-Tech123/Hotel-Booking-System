const express = require("express");
const bookingController = require("../controllers/bookingController");
const { requireUser } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();

router.use(requireUser);
router.get("/search", asyncHandler(bookingController.searchHotels));
router.post("/", asyncHandler(bookingController.createBooking));
router.get("/my", asyncHandler(bookingController.getUserBookings));
router.get("/:id/bill", asyncHandler(bookingController.downloadBill));

module.exports = router;
