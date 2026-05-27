const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true, index: true },
        totalRooms: { type: Number, required: true, min: 1 },
        images: [{ type: String }]
    },
    { timestamps: true, collection: "hotels" }
);

module.exports = mongoose.model("Hotel", hotelSchema);
