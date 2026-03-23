const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");

const ROOM_DETAILS = {
    "Single Suite": { pricePerNight: 2800 },
    "Executive Room": { pricePerNight: 4200 },
    "Presidential Suite": { pricePerNight: 7500 }
};

const ROOM_FEATURES = {
    Breakfast: 1200,
    Dinner: 500,
    TV: 1300,
    AC: 1000
};

function sha256(value) {
    return crypto.createHash("sha256").update(String(value)).digest("hex");
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const adminConfigured = Boolean(ADMIN_EMAIL) && Boolean(ADMIN_PASSWORD_HASH || ADMIN_PASSWORD);
const expectedAdminPasswordHash = ADMIN_PASSWORD_HASH ? ADMIN_PASSWORD_HASH : sha256(ADMIN_PASSWORD);
const adminTokens = new Set();

function getBearerToken(req) {
    const header = req.headers["authorization"] || "";
    const match = String(header).match(/^Bearer\s+(.+)$/i);
    return match ? match[1] : "";
}

function parseDateTime(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d;
}

function nightsBetween(checkinStr, checkoutStr) {
    const checkin = parseDateTime(checkinStr);
    const checkout = parseDateTime(checkoutStr);
    if (!checkin || !checkout) return null;
    const msPerDay = 1000 * 60 * 60 * 24;
    const diff = checkout.getTime() - checkin.getTime();
    if (diff <= 0) return null;
    // If someone books same-day (datetime), treat any positive time within 24h as 1 night.
    return Math.max(1, Math.ceil(diff / msPerDay));
}

function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(BOOKINGS_FILE)) fs.writeFileSync(BOOKINGS_FILE, "[]", "utf8");
    if (!fs.existsSync(REVIEWS_FILE)) fs.writeFileSync(REVIEWS_FILE, "[]", "utf8");
}

function readBookings() {
    ensureDataFile();
    const raw = fs.readFileSync(BOOKINGS_FILE, "utf8");
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeBookings(bookings) {
    ensureDataFile();
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), "utf8");
}

function readReviews() {
    ensureDataFile();
    const raw = fs.readFileSync(REVIEWS_FILE, "utf8");
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeReviews(reviews) {
    ensureDataFile();
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), "utf8");
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
    });
    res.end(JSON.stringify(payload));
}

function setCors(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", chunk => {
            data += chunk;
            if (data.length > 1e6) {
                reject(new Error("Request body too large"));
                req.destroy();
            }
        });
        req.on("end", () => resolve(data));
        req.on("error", reject);
    });
}

ensureDataFile();

const server = http.createServer(async (req, res) => {
    setCors(res);

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = req.url || "";

    if (req.method === "POST" && url === "/api/bookings") {
        try {
            const raw = await readRequestBody(req);
            const body = JSON.parse(raw || "{}");

            const checkin = body.checkin;
            const checkout = body.checkout;
            const guests = body.guests;
            const roomType = body.roomType;
            const user_id = body.user_id;
            const features = Array.isArray(body.features) ? body.features : [];

            if (!user_id || !checkin || !checkout || !roomType) {
                return sendJson(res, 400, { error: "Missing required fields." });
            }

            const nightsComputed = nightsBetween(checkin, checkout);
            if (!nightsComputed) {
                return sendJson(res, 400, { error: "Invalid date range." });
            }

            if (!ROOM_DETAILS[roomType]) {
                return sendJson(res, 400, { error: "Invalid room type." });
            }

            const guestsNumber = Number(guests);
            if (!Number.isFinite(guestsNumber) || guestsNumber < 1) {
                return sendJson(res, 400, { error: "Guests must be at least 1." });
            }

            const pricePerNight = ROOM_DETAILS[roomType].pricePerNight;
            const roomTotalComputed = nightsComputed * pricePerNight;

            // Validate and compute feature totals.
            const selectedFeatures = [];
            let featuresCost = 0;
            for (const featureKey of features) {
                if (!ROOM_FEATURES[featureKey]) continue;
                if (selectedFeatures.includes(featureKey)) continue;
                selectedFeatures.push(featureKey);
                featuresCost += ROOM_FEATURES[featureKey];
            }

            const totalAmountComputed = roomTotalComputed + featuresCost;

            const booking = {
                id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                createdAt: new Date().toISOString(),
                user_id,
                checkin,
                checkout,
                guests: guestsNumber,
                roomType,
                nights: nightsComputed,
                features: selectedFeatures,
                featuresCost,
                roomTotalPrice: roomTotalComputed,
                totalAmount: totalAmountComputed,
                // Backwards compatibility (older frontend used totalPrice)
                totalPrice: roomTotalComputed
            };

            const bookings = readBookings();
            bookings.unshift(booking);
            writeBookings(bookings);

            return sendJson(res, 201, booking);
        } catch (err) {
            return sendJson(res, 400, { error: err.message || "Bad request." });
        }
    }

    if (req.method === "POST" && url === "/api/reviews") {
        try {
            const raw = await readRequestBody(req);
            const body = JSON.parse(raw || "{}");

            const user_id = body.user_id;
            const booking_id = body.booking_id;
            const rating = Number(body.rating);
            const comment = typeof body.comment === "string" ? body.comment.trim() : "";

            if (!user_id || !booking_id || !Number.isFinite(rating)) {
                return sendJson(res, 400, { error: "Missing required fields." });
            }
            const ratingInt = Math.round(rating);
            if (ratingInt < 1 || ratingInt > 5) {
                return sendJson(res, 400, { error: "Rating must be between 1 and 5." });
            }

            const bookings = readBookings();
            const booking = bookings.find(b => b.id === booking_id);
            if (!booking) {
                return sendJson(res, 404, { error: "Booking not found." });
            }

            const reviews = readReviews();
            const existing = reviews.find(r => r.booking_id === booking_id && r.user_id === user_id);
            if (existing) {
                return sendJson(res, 409, { error: "Review already submitted for this booking." });
            }

            const review = {
                id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                user_id,
                booking_id,
                roomType: booking.roomType,
                rating: ratingInt,
                comment,
                createdAt: new Date().toISOString()
            };

            reviews.unshift(review);
            writeReviews(reviews);
            return sendJson(res, 201, review);
        } catch (err) {
            return sendJson(res, 400, { error: err.message || "Bad request." });
        }
    }

    if (req.method === "POST" && url === "/api/admin/login") {
        try {
            if (!adminConfigured) {
                return sendJson(res, 400, { error: "Admin login not configured on server." });
            }

            const raw = await readRequestBody(req);
            const body = JSON.parse(raw || "{}");
            const email = body.email;
            const password = body.password;

            if (!email || !password) {
                return sendJson(res, 400, { error: "Missing email/password." });
            }

            if (String(email).toLowerCase() !== String(ADMIN_EMAIL).toLowerCase()) {
                return sendJson(res, 401, { error: "Invalid credentials." });
            }

            if (sha256(password) !== expectedAdminPasswordHash) {
                return sendJson(res, 401, { error: "Invalid credentials." });
            }

            const token = crypto.randomBytes(24).toString("hex");
            adminTokens.add(token);
            return sendJson(res, 200, { token });
        } catch (err) {
            return sendJson(res, 400, { error: err.message || "Bad request." });
        }
    }

    if (req.method === "GET" && url.startsWith("/api/bookings")) {
        const query = new URL(req.url || "", `http://${req.headers.host}`).searchParams;
        const user_id = query.get("user_id") || "";

        // If admin credentials are configured, protect "all bookings" but allow per-user reads.
        if (adminConfigured && !user_id) {
            const token = getBearerToken(req);
            if (!token || !adminTokens.has(token)) {
                return sendJson(res, 401, { error: "Unauthorized." });
            }
        }

        const bookings = readBookings();
        if (user_id) {
            return sendJson(res, 200, bookings.filter(b => b.user_id === user_id));
        }
        return sendJson(res, 200, bookings);
    }

    if (req.method === "GET" && url.startsWith("/api/reviews")) {
        const query = new URL(req.url || "", `http://${req.headers.host}`).searchParams;
        const roomType = query.get("roomType") || "";
        const user_id = query.get("user_id") || "";
        const booking_id = query.get("booking_id") || "";

        const reviews = readReviews();

        if (roomType) {
            const filtered = reviews.filter(r => r.roomType === roomType);
            const count = filtered.length;
            const averageRating = count
                ? filtered.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count
                : 0;
            return sendJson(res, 200, {
                roomType,
                averageRating,
                count,
                reviews: filtered
            });
        }

        if (user_id) {
            return sendJson(res, 200, reviews.filter(r => r.user_id === user_id));
        }

        if (booking_id) {
            return sendJson(res, 200, reviews.filter(r => r.booking_id === booking_id));
        }

        return sendJson(res, 200, reviews);
    }

    if (req.method === "GET" && url === "/api/rooms/ratings") {
        const reviews = readReviews();
        const rooms = Object.keys(ROOM_DETAILS);

        const ratings = {};
        rooms.forEach(roomType => {
            const filtered = reviews.filter(r => r.roomType === roomType);
            const count = filtered.length;
            const averageRating = count
                ? filtered.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count
                : 0;
            ratings[roomType] = { averageRating, count };
        });

        return sendJson(res, 200, { ratings });
    }

    return sendJson(res, 404, { error: "Not found." });
});

server.listen(PORT, () => {
    console.log(`LuxuryStay backend listening on http://localhost:${PORT}`);
});

