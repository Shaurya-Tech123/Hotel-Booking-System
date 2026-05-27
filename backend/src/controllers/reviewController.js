const mongoose = require("mongoose");
const Review = require("../models/Review");
const Hotel = require("../models/Hotel");
const User = require("../models/User");

async function addReview(req, res) {
    const { hotelId, rating, comment } = req.body;

    if (!hotelId || !rating || !comment?.trim()) {
        return res.status(400).json({ error: "Hotel, rating, and comment are required" });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    const user = await User.findById(req.auth.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const existing = await Review.findOne({ hotelId, userId: user._id });
    if (existing) {
        return res.status(409).json({ error: "You have already reviewed this hotel" });
    }

    const review = await Review.create({
        hotelId,
        userId: user._id,
        username: user.username,
        rating: Number(rating),
        comment: comment.trim()
    });

    const stats = await getReviewStatsForHotel(hotelId);
    res.status(201).json({ review, ...stats });
}

async function getHotelReviews(req, res) {
    const reviews = await Review.find({ hotelId: req.params.hotelId }).sort({ createdAt: -1 });
    const stats = await getReviewStatsForHotel(req.params.hotelId);
    res.json({ reviews, ...stats });
}

async function getReviewStats(req, res) {
    const stats = await getReviewStatsForHotel(req.params.hotelId);
    res.json(stats);
}

// Computes average rating and distribution for a hotel
async function getReviewStatsForHotel(hotelId) {
    const result = await Review.aggregate([
        { $match: { hotelId: new mongoose.Types.ObjectId(hotelId) } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: "$rating" },
                reviewCount: { $sum: 1 },
                ratings: { $push: "$rating" }
            }
        }
    ]);

    if (!result.length) {
        return { averageRating: 0, reviewCount: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }

    const { averageRating, reviewCount, ratings } = result[0];
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
        ratingDistribution[r] = (ratingDistribution[r] || 0) + 1;
    });

    return {
        averageRating: Number(averageRating.toFixed(1)),
        reviewCount,
        ratingDistribution
    };
}

module.exports = { addReview, getHotelReviews, getReviewStats, getReviewStatsForHotel };
