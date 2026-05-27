const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        username: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true, trim: true }
    },
    { timestamps: true, collection: "reviews" }
);

reviewSchema.index({ hotelId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
