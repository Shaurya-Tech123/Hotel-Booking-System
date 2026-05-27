const express = require("express");
const uploadController = require("../controllers/uploadController");
const { requireAdmin } = require("../middlewares/authMiddleware");
const { hotelUpload, roomUpload } = require("../middlewares/uploadMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();

router.use(requireAdmin);

router.post(
    "/hotel",
    hotelUpload.array("images", 10),
    asyncHandler(uploadController.uploadHotelImages)
);

router.post(
    "/room",
    roomUpload.array("images", 10),
    asyncHandler(uploadController.uploadRoomImages)
);

module.exports = router;
