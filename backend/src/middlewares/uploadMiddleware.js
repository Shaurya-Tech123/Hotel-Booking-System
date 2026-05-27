const path = require("path");
const fs = require("fs");
const multer = require("multer");

const UPLOAD_ROOT = path.join(__dirname, "../../uploads");
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file

["hotels", "rooms"].forEach(folder => {
    const dir = path.join(UPLOAD_ROOT, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function createStorage(subfolder) {
    return multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, path.join(UPLOAD_ROOT, subfolder)),
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
            const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
            cb(null, safeName);
        }
    });
}

function fileFilter(_req, file, cb) {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
        return cb(new Error("Only JPG, JPEG, and PNG images are allowed"));
    }
    cb(null, true);
}

const hotelUpload = multer({
    storage: createStorage("hotels"),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter
});

const roomUpload = multer({
    storage: createStorage("rooms"),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter
});

module.exports = { hotelUpload, roomUpload, UPLOAD_ROOT };
