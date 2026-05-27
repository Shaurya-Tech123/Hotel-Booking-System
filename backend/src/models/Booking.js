const mongoose = require("mongoose");

const selectedFeatureSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 }
    },
    { _id: false }
);

const bookingSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        username: { type: String, required: true },
        hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
        hotelName: { type: String, required: true },
        roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true, index: true },
        roomCategory: { type: String, required: true },
        checkIn: { type: Date, required: true, index: true },
        checkOut: { type: Date, required: true, index: true },
        nights: { type: Number, required: true, min: 1 },
        roomPricePerDay: { type: Number, required: true },
        selectedFeatures: [selectedFeatureSchema],
        featuresTotal: { type: Number, default: 0 },
        roomTotal: { type: Number, required: true },
        totalBill: { type: Number, required: true },
        status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" }
    },
    { timestamps: true, collection: "bookings" }
);

module.exports = mongoose.model("Booking", bookingSchema);
