// Handles admin image uploads for hotels and rooms

function mapUploadedFiles(files, folder) {
    return (files || []).map(file => `/uploads/${folder}/${file.filename}`);
}

async function uploadHotelImages(req, res) {
    const urls = mapUploadedFiles(req.files, "hotels");
    if (!urls.length) return res.status(400).json({ error: "No images uploaded" });
    res.status(201).json({ message: "Hotel images uploaded", urls });
}

async function uploadRoomImages(req, res) {
    const urls = mapUploadedFiles(req.files, "rooms");
    if (!urls.length) return res.status(400).json({ error: "No images uploaded" });
    res.status(201).json({ message: "Room images uploaded", urls });
}

module.exports = { uploadHotelImages, uploadRoomImages };
