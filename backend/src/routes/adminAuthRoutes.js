const express = require("express");
const adminAuthController = require("../controllers/adminAuthController");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();

router.post("/register", asyncHandler(adminAuthController.register));
router.post("/login", asyncHandler(adminAuthController.login));

module.exports = router;
