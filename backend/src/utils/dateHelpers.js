function parseDateOnly(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
}

function calculateNights(checkIn, checkOut) {
    const start = parseDateOnly(checkIn);
    const end = parseDateOnly(checkOut);
    if (!start || !end || end <= start) return 0;
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

function datesOverlap(checkIn, checkOut, existingCheckIn, existingCheckOut) {
    return checkIn < existingCheckOut && checkOut > existingCheckIn;
}

module.exports = { parseDateOnly, calculateNights, datesOverlap };
