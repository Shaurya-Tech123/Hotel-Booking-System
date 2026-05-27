const { Booking, Review, Room } = require("../models");

function nightsBetween(checkin, checkout) {
    const start = new Date(checkin);
    const end = new Date(checkout);
    const diff = end.getTime() - start.getTime();
    if (!Number.isFinite(diff) || diff <= 0) return null;
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function overlap(aStart, aEnd, bStart, bEnd) {
    return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

async function calculateDynamicPrice(roomType, checkin, checkout) {
    const room = await Room.findOne({ roomType }).lean();
    if (!room) throw new Error("Invalid room type");
    const existing = await Booking.find({ roomType, status: "CONFIRMED" }).lean();
    const occupied = existing.filter(b => overlap(b.checkin, b.checkout, checkin, checkout)).length;
    const demandRatio = occupied / room.capacity;
    let multiplier = 1;
    if (demandRatio > 0.8) multiplier = 1.4;
    else if (demandRatio > 0.5) multiplier = 1.2;
    const month = new Date(checkin).getMonth() + 1;
    const seasonal = [4, 5, 6, 11, 12].includes(month) ? 1.1 : 1;
    return { pricePerNight: Math.round(room.basePrice * multiplier * seasonal), capacity: room.capacity, occupied };
}

async function recommendRoomForUser(userId) {
    const recentBookings = await Booking.find({ userId }).sort({ createdAt: -1 }).limit(10).lean();
    const reviews = await Review.find({ userId }).lean();
    const roomPreference = recentBookings[0]?.roomType || "Executive Room";
    const reason = reviews.length ? "Based on your booking and rating behavior." : "Based on trend popularity.";
    return { suggestedRoomType: roomPreference, alternatives: ["Single Suite", "Presidential Suite"], reason };
}

async function predictOccupancy() {
    const bookings = await Booking.find({ status: "CONFIRMED" }).lean();
    const monthlyHistory = {};
    for (const booking of bookings) {
        const month = new Date(booking.checkin).toISOString().slice(0, 7);
        monthlyHistory[month] = (monthlyHistory[month] || 0) + 1;
    }
    const values = Object.values(monthlyHistory);
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    return { monthlyHistory, nextMonthForecast: Math.round(avg * 1.08) };
}

module.exports = { nightsBetween, calculateDynamicPrice, recommendRoomForUser, predictOccupancy };
