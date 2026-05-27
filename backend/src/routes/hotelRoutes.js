const express = require("express");
const hotelController = require("../controllers/hotelController");
const { requireAdmin } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();

router.get("/options", asyncHandler(hotelController.getFeatureOptions));

router.use(requireAdmin);
router.post("/", asyncHandler(hotelController.createHotel));
router.get("/", asyncHandler(hotelController.getHotels));
router.get("/:id", asyncHandler(hotelController.getHotelById));
router.put("/:id", asyncHandler(hotelController.updateHotel));
router.delete("/:id", asyncHandler(hotelController.deleteHotel));
router.post("/:hotelId/rooms", asyncHandler(hotelController.addOrUpdateRoom));
router.patch("/rooms/:roomId/availability", asyncHandler(hotelController.updateRoomAvailability));
router.delete("/rooms/:roomId", asyncHandler(hotelController.deleteRoom));

module.exports = router;
