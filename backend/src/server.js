const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const env = require("./config/env");
const { connectDb } = require("./config/db");
const logger = require("./config/logger");
const { Room } = require("./models");

async function seedRooms() {
    const seed = [
        { roomType: "Single Suite", basePrice: 2800, capacity: 10, amenities: ["Breakfast", "Wi-Fi"] },
        { roomType: "Executive Room", basePrice: 4200, capacity: 8, amenities: ["Breakfast", "Work Desk"] },
        { roomType: "Presidential Suite", basePrice: 7500, capacity: 5, amenities: ["Lounge", "City View"] }
    ];
    for (const room of seed) {
        await Room.updateOne({ roomType: room.roomType }, { $setOnInsert: room }, { upsert: true });
    }
}

async function bootstrap() {
    await connectDb();
    await seedRooms();

    const server = http.createServer(app);
    const io = new Server(server, {
        cors: { origin: env.clientOrigin, methods: ["GET", "POST"] }
    });
    app.set("io", io);

    io.on("connection", socket => {
        socket.emit("system:connected", { ok: true, at: new Date().toISOString() });
    });

    server.listen(env.port, () => {
        logger.info(`HMS API + Socket running at http://localhost:${env.port}`);
    });
}

bootstrap().catch(err => {
    logger.error(err);
    process.exit(1);
});
