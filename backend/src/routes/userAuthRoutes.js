const express = require("express");
const userAuthController = require("../controllers/userAuthController");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();

router.post("/register", asyncHandler(userAuthController.register));
router.post("/login", asyncHandler(userAuthController.login));

module.exports = router;
