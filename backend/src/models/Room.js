const mongoose = require("mongoose");

const ROOM_CATEGORIES = ["Single Suite", "Executive Room", "Presidential Suite"];

const featureSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 }
    },
    { _id: false }
);

const roomSchema = new mongoose.Schema(
    {
        hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
        category: { type: String, enum: ROOM_CATEGORIES, required: true },
        pricePerDay: { type: Number, required: true, min: 0 },
        availability: { type: Number, required: true, min: 0 },
        images: [{ type: String }],
        features: [featureSchema],
        description: { type: String, default: "" }
    },
    { timestamps: true, collection: "rooms" }
);

roomSchema.index({ hotelId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("Room", roomSchema);
module.exports.ROOM_CATEGORIES = ROOM_CATEGORIES;
