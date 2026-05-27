const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const { ROOM_CATEGORIES } = require("../models/Room");

const DEFAULT_FEATURES = [
    "AC", "Non AC", "TV", "WiFi", "Breakfast", "Lunch", "Dinner", "Parking", "Swimming Pool"
];

async function createHotel(req, res) {
    const { name, address, city, totalRooms, rooms, images } = req.body;

    if (!name || !address || !city || !totalRooms) {
        return res.status(400).json({ error: "Hotel name, address, city, and total rooms are required" });
    }

    const hotel = await Hotel.create({
        name,
        address,
        city,
        totalRooms: Number(totalRooms),
        images: Array.isArray(images) ? images : []
    });

    if (Array.isArray(rooms) && rooms.length) {
        for (const room of rooms) {
            if (!ROOM_CATEGORIES.includes(room.category)) continue;
            await Room.create({
                hotelId: hotel._id,
                category: room.category,
                pricePerDay: Number(room.pricePerDay) || 0,
                availability: Number(room.availability) || 0,
                images: room.images || [],
                features: (room.features || []).map(f => ({ name: f.name, price: Number(f.price) || 0 })),
                description: room.description || ""
            });
        }
    }

    const createdRooms = await Room.find({ hotelId: hotel._id });
    res.status(201).json({ hotel, rooms: createdRooms });
}

async function getHotels(_req, res) {
    const hotels = await Hotel.find().sort({ createdAt: -1 });
    res.json({ hotels });
}

async function getHotelById(req, res) {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    const rooms = await Room.find({ hotelId: hotel._id });
    res.json({ hotel, rooms });
}

async function updateHotel(req, res) {
    const { name, address, city, totalRooms, images } = req.body;
    const update = {
        name,
        address,
        city,
        totalRooms: totalRooms != null ? Number(totalRooms) : undefined
    };
    if (images !== undefined) update.images = images;
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    res.json({ hotel });
}

async function deleteHotel(req, res) {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    await Room.deleteMany({ hotelId: hotel._id });
    res.json({ message: "Hotel deleted successfully" });
}

async function addOrUpdateRoom(req, res) {
    const { hotelId } = req.params;
    const { category, pricePerDay, availability, images, features, description } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    if (!ROOM_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: "Invalid room category" });
    }

    const room = await Room.findOneAndUpdate(
        { hotelId, category },
        {
            pricePerDay: Number(pricePerDay),
            availability: Number(availability),
            images: images || [],
            features: (features || []).map(f => ({ name: f.name, price: Number(f.price) || 0 })),
            description: description || ""
        },
        { new: true, upsert: true, runValidators: true }
    );

    res.json({ room });
}

async function updateRoomAvailability(req, res) {
    const { availability } = req.body;
    const room = await Room.findByIdAndUpdate(
        req.params.roomId,
        { availability: Number(availability) },
        { new: true }
    );
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json({ room });
}

async function deleteRoom(req, res) {
    const room = await Room.findByIdAndDelete(req.params.roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json({ message: "Room deleted successfully" });
}

async function getFeatureOptions(_req, res) {
    res.json({ features: DEFAULT_FEATURES, categories: ROOM_CATEGORIES });
}

module.exports = {
    createHotel,
    getHotels,
    getHotelById,
    updateHotel,
    deleteHotel,
    addOrUpdateRoom,
    updateRoomAvailability,
    deleteRoom,
    getFeatureOptions
};
