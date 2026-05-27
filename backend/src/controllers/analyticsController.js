const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");

// Admin analytics using MongoDB aggregation pipelines
async function getDashboardAnalytics(_req, res) {
    const matchConfirmed = { status: "confirmed" };

    const [revenueResult, topHotels, topRoomCategories, topCities, monthlyBookings, topFeatures, totalBookings, totalHotels] =
        await Promise.all([
            Booking.aggregate([
                { $match: matchConfirmed },
                { $group: { _id: null, totalRevenue: { $sum: "$totalBill" } } }
            ]),
            Booking.aggregate([
                { $match: matchConfirmed },
                { $group: { _id: "$hotelId", hotelName: { $first: "$hotelName" }, bookings: { $sum: 1 } } },
                { $sort: { bookings: -1 } },
                { $limit: 8 }
            ]),
            Booking.aggregate([
                { $match: matchConfirmed },
                { $group: { _id: "$roomCategory", bookings: { $sum: 1 } } },
                { $sort: { bookings: -1 } }
            ]),
            Booking.aggregate([
                { $match: matchConfirmed },
                {
                    $lookup: {
                        from: "hotels",
                        localField: "hotelId",
                        foreignField: "_id",
                        as: "hotel"
                    }
                },
                { $unwind: "$hotel" },
                { $group: { _id: "$hotel.city", bookings: { $sum: 1 } } },
                { $sort: { bookings: -1 } },
                { $limit: 8 }
            ]),
            Booking.aggregate([
                { $match: matchConfirmed },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        bookings: { $sum: 1 },
                        revenue: { $sum: "$totalBill" }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            Booking.aggregate([
                { $match: matchConfirmed },
                { $unwind: "$selectedFeatures" },
                { $group: { _id: "$selectedFeatures.name", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            Booking.countDocuments(matchConfirmed),
            Hotel.countDocuments()
        ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const mostBookedHotel = topHotels[0] || null;
    const mostBookedRoom = topRoomCategories[0] || null;
    const mostBookedCity = topCities[0] || null;

    res.json({
        summary: {
            totalRevenue,
            totalBookings,
            totalHotels,
            mostBookedHotel: mostBookedHotel
                ? { name: mostBookedHotel.hotelName, bookings: mostBookedHotel.bookings }
                : null,
            mostBookedRoom: mostBookedRoom ? { category: mostBookedRoom._id, bookings: mostBookedRoom.bookings } : null,
            mostBookedCity: mostBookedCity ? { city: mostBookedCity._id, bookings: mostBookedCity.bookings } : null
        },
        charts: {
            topHotels: topHotels.map(h => ({ name: h.hotelName, bookings: h.bookings })),
            topRoomCategories: topRoomCategories.map(r => ({ category: r._id, bookings: r.bookings })),
            topCities: topCities.map(c => ({ city: c._id, bookings: c.bookings })),
            monthlyBookings: monthlyBookings.map(m => ({
                month: m._id,
                bookings: m.bookings,
                revenue: m.revenue
            })),
            topFeatures: topFeatures.map(f => ({ feature: f._id, count: f.count }))
        }
    });
}

module.exports = { getDashboardAnalytics };
