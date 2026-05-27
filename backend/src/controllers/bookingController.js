const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Review = require("../models/Review");
const User = require("../models/User");
const { calculateNights, parseDateOnly, datesOverlap } = require("../utils/dateHelpers");
const { generateBookingBill } = require("../services/pdfService");

async function searchHotels(req, res) {
    const { city, checkIn, checkOut } = req.query;
    if (!city || !checkIn || !checkOut) {
        return res.status(400).json({ error: "City, check-in, and check-out dates are required" });
    }

    const nights = calculateNights(checkIn, checkOut);
    if (nights < 1) return res.status(400).json({ error: "Check-out must be after check-in" });

    const checkInDate = parseDateOnly(checkIn);
    const checkOutDate = parseDateOnly(checkOut);

    const hotels = await Hotel.find({ city: new RegExp(`^${city.trim()}$`, "i") });
    const results = [];

    for (const hotel of hotels) {
        const rooms = await Room.find({ hotelId: hotel._id });
        const reviews = await Review.find({ hotelId: hotel._id }).sort({ createdAt: -1 });
        const avgRating =
            reviews.length > 0
                ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1))
                : 0;

        const roomDetails = [];
        for (const room of rooms) {
            const overlapping = await Booking.find({
                roomId: room._id,
                status: "confirmed",
                checkIn: { $lt: checkOutDate },
                checkOut: { $gt: checkInDate }
            });

            const bookedCount = overlapping.length;
            const availableSlots = Math.max(0, room.availability - bookedCount);

            roomDetails.push({
                _id: room._id,
                category: room.category,
                pricePerDay: room.pricePerDay,
                availability: availableSlots,
                images: room.images,
                features: room.features,
                description: room.description,
                isAvailable: availableSlots > 0
            });
        }

        results.push({
            hotel: {
                _id: hotel._id,
                name: hotel.name,
                address: hotel.address,
                city: hotel.city,
                totalRooms: hotel.totalRooms,
                images: hotel.images || []
            },
            rooms: roomDetails.filter(r => r.isAvailable),
            allRooms: roomDetails,
            rating: avgRating,
            reviewCount: reviews.length,
            reviews: reviews.map(r => ({
                username: r.username,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt
            }))
        });
    }

    res.json({ nights, hotels: results });
}

async function createBooking(req, res) {
    const { hotelId, roomId, checkIn, checkOut, selectedFeatures } = req.body;

    const nights = calculateNights(checkIn, checkOut);
    if (nights < 1) return res.status(400).json({ error: "Invalid date range" });

    const checkInDate = parseDateOnly(checkIn);
    const checkOutDate = parseDateOnly(checkOut);

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    const room = await Room.findOne({ _id: roomId, hotelId });
    if (!room) return res.status(404).json({ error: "Room not found" });

    const overlapping = await Booking.find({
        roomId: room._id,
        status: "confirmed",
        checkIn: { $lt: checkOutDate },
        checkOut: { $gt: checkInDate }
    });

    if (overlapping.length >= room.availability) {
        return res.status(409).json({ error: "Room not available for selected dates" });
    }

    const user = await User.findById(req.auth.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const validFeatureNames = room.features.map(f => f.name);
    const features = (selectedFeatures || [])
        .filter(f => validFeatureNames.includes(f.name))
        .map(f => {
            const match = room.features.find(rf => rf.name === f.name);
            return { name: f.name, price: match.price };
        });

    const featuresTotal = features.reduce((sum, f) => sum + f.price, 0);
    const roomTotal = room.pricePerDay * nights;
    const totalBill = roomTotal + featuresTotal;

    const booking = await Booking.create({
        userId: user._id,
        username: user.username,
        hotelId: hotel._id,
        hotelName: hotel.name,
        roomId: room._id,
        roomCategory: room.category,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        roomPricePerDay: room.pricePerDay,
        selectedFeatures: features,
        featuresTotal,
        roomTotal,
        totalBill
    });

    await Payment.create({
        bookingId: booking._id,
        userId: user._id,
        amount: totalBill,
        currency: "INR",
        status: "paid"
    });

    res.status(201).json({ message: "Booking confirmed", booking });
}

async function getUserBookings(req, res) {
    const bookings = await Booking.find({ userId: req.auth.id }).sort({ createdAt: -1 });
    res.json({ bookings });
}

async function downloadBill(req, res) {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.auth.id });
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const pdfBuffer = await generateBookingBill(booking);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=bill-${booking._id}.pdf`);
    res.send(pdfBuffer);
}

module.exports = { searchHotels, createBooking, getUserBookings, downloadBill };
