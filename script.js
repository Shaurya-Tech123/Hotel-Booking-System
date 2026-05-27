const ROOM_DETAILS = {
    "Single Suite": {
        pricePerNight: 2800,
        description: "Modern comfort with serene ambiance.",
        features: ["Serene ambiance", "Premium bedding", "Quiet & private stay"]
    },
    "Executive Room": {
        pricePerNight: 4200,
        description: "Spacious luxury designed for business & leisure.",
        features: ["Work-friendly layout", "Luxury finishing", "Comfort-first design"]
    },
    "Presidential Suite": {
        pricePerNight: 7500,
        description: "Premium elegance with exclusive services.",
        features: ["Exclusive services", "Premium living space", "Elevated comfort"]
    }
};

const ROOM_TYPES = Object.keys(ROOM_DETAILS);

const FEATURES = {
    Breakfast: 1200,
    Dinner: 500,
    TV: 1300,
    AC: 1000
};

const LOCAL_STORAGE_BOOKINGS_KEY = "luxurystay_bookings";
const LOCAL_STORAGE_USER_ID_KEY = "luxurystay_user_id";
const LOCAL_STORAGE_LOCAL_REVIEWS_KEY = "luxurystay_local_reviews";
const ADMIN_TOKEN_KEY = "luxurystay_admin_token";

const bookingForm = document.getElementById("bookingForm");
const bookingMessage = document.getElementById("bookingMessage");
const bookingApiUrl = document.body?.dataset?.bookingApiUrl || "/api/bookings";
const featuresCostText = document.getElementById("featuresCostText");

const myBookingsList = document.getElementById("myBookingsList");
const refreshMyBookingsButton = document.getElementById("refreshMyBookings");
const clearMyBookingsButton = document.getElementById("clearMyBookings");

const adminBookingsList = document.getElementById("adminBookingsList");
const loadAdminBookingsButton = document.getElementById("loadAdminBookings");
const adminAuthWrap = document.getElementById("adminAuthWrap");
const adminEmailInput = document.getElementById("adminEmail");
const adminPasswordInput = document.getElementById("adminPassword");
const adminLoginButton = document.getElementById("adminLoginButton");
const adminAuthMessage = document.getElementById("adminAuthMessage");

const detailsModal = document.getElementById("detailsModal");
const detailsCloseButton = detailsModal?.querySelector(".modal-close");
const detailsImage = document.getElementById("detailsImage");
const detailsTitle = document.getElementById("detailsTitle");
const detailsPrice = document.getElementById("detailsPrice");
const detailsDescription = document.getElementById("detailsDescription");
const detailsFeatures = document.getElementById("detailsFeatures");

const reviewsModal = document.getElementById("reviewsModal");
const reviewsCloseButton = reviewsModal?.querySelector(".modal-close");
const reviewsTitle = document.getElementById("reviewsTitle");
const reviewsSummary = document.getElementById("reviewsSummary");
const reviewsList = document.getElementById("reviewsList");

const apiBase = new URL(bookingApiUrl, window.location.href);
const apiOrigin = apiBase.origin;
function apiUrl(path) {
    return new URL(path, `${apiOrigin}/`).toString();
}

function getUserId() {
    try {
        const existing = localStorage.getItem(LOCAL_STORAGE_USER_ID_KEY);
        if (existing) return existing;
        const uuid = (crypto && crypto.randomUUID && crypto.randomUUID()) || `u-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, uuid);
        return uuid;
    } catch {
        // If localStorage is blocked, fall back to a best-effort ID (still works for current session).
        return `u-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}

function parseDateTime(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d;
}

function computeNights(checkinStr, checkoutStr) {
    const checkin = parseDateTime(checkinStr);
    const checkout = parseDateTime(checkoutStr);
    if (!checkin || !checkout) return null;
    const diffMs = checkout.getTime() - checkin.getTime();
    if (diffMs <= 0) return null;
    const msPerDay = 1000 * 60 * 60 * 24;
    // Handle same-day booking: if checkout is later but less than 24h, treat it as 1 night.
    return Math.max(1, Math.ceil(diffMs / msPerDay));
}

function formatINR(amount) {
    const safe = Number(amount) || 0;
    return `₹${safe.toLocaleString("en-IN")}`;
}

function formatDateTime(dateStr) {
    const d = parseDateTime(dateStr);
    if (!d) return dateStr || "-";
    return d.toLocaleString("en-IN", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function setBookingMessage(text, isError) {
    if (!bookingMessage) return;
    bookingMessage.textContent = text || "";
    bookingMessage.style.color = isError ? "#b00020" : "#111";
    bookingMessage.style.borderColor = isError ? "#b00020" : "#d4af37";
}

function loadLocalBookings() {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY) || "[]";
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveBookingToLocalStorage(booking) {
    try {
        const existing = loadLocalBookings();
        existing.unshift(booking);
        localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(existing));
        return true;
    } catch (err) {
        console.error("LocalStorage save error:", err);
        return false;
    }
}

function saveLocalReviews(reviews) {
    try {
        localStorage.setItem(LOCAL_STORAGE_LOCAL_REVIEWS_KEY, JSON.stringify(reviews));
        return true;
    } catch (err) {
        console.error("Local reviews save error:", err);
        return false;
    }
}

function loadLocalReviews() {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_LOCAL_REVIEWS_KEY) || "[]";
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function normalizeBooking(b) {
    const roomType = b.roomType || "-";
    const checkin = b.checkin || "";
    const checkout = b.checkout || "";

    const nights = Number.isFinite(b.nights) ? b.nights : computeNights(checkin, checkout) || 0;
    const featuresArr = Array.isArray(b.features) ? b.features : [];
    const featuresCost = Number.isFinite(b.featuresCost) ? b.featuresCost : featuresArr.reduce((sum, key) => sum + (FEATURES[key] || 0), 0);
    const roomTotalPrice = Number.isFinite(b.roomTotalPrice) ? b.roomTotalPrice : nights * (ROOM_DETAILS[roomType]?.pricePerNight || 0);
    const totalAmount = Number.isFinite(b.totalAmount) ? b.totalAmount : roomTotalPrice + featuresCost;

    return {
        ...b,
        roomType,
        checkin,
        checkout,
        nights,
        features: featuresArr.filter(k => FEATURES[k]),
        featuresCost,
        roomTotalPrice,
        totalAmount
    };
}

function getSelectedFeaturesFromForm() {
    const selected = [];
    document.querySelectorAll(".booking-feature").forEach(input => {
        if (input.checked) selected.push(input.value);
    });
    return selected;
}

function updateFeaturesCostText() {
    if (!featuresCostText) return;
    const selected = getSelectedFeaturesFromForm();
    const cost = selected.reduce((sum, key) => sum + (FEATURES[key] || 0), 0);
    featuresCostText.textContent = `Features cost: ${formatINR(cost)}`;
}

function renderStars(rating) {
    const safe = Number(rating) || 0;
    const rounded = Math.max(0, Math.min(5, Math.round(safe)));
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(i <= rounded ? "★" : "☆");
    }
    return stars.join("");
}

function openDetailsModal(roomType, triggerEl) {
    const roomDetail = ROOM_DETAILS[roomType];
    if (!roomDetail) return;

    const imgSrc = triggerEl?.closest(".room-card")?.querySelector("img")?.getAttribute("src") || "";

    if (detailsImage) {
        detailsImage.src = imgSrc;
        detailsImage.alt = roomType;
    }
    if (detailsTitle) detailsTitle.textContent = roomType;
    if (detailsPrice) detailsPrice.textContent = `${formatINR(roomDetail.pricePerNight)} / night`;
    if (detailsDescription) detailsDescription.textContent = roomDetail.description;
    if (detailsFeatures) {
        detailsFeatures.innerHTML = "";
        roomDetail.features.forEach(feature => {
            const li = document.createElement("li");
            li.textContent = feature;
            detailsFeatures.appendChild(li);
        });
    }

    if (detailsModal) {
        detailsModal.classList.add("open");
        detailsModal.setAttribute("aria-hidden", "false");
    }
}

function closeDetailsModal() {
    if (!detailsModal) return;
    detailsModal.classList.remove("open");
    detailsModal.setAttribute("aria-hidden", "true");
}

function openReviewsModal(roomType, avg, count) {
    if (reviewsTitle) reviewsTitle.textContent = roomType;
    if (reviewsSummary) {
        if (typeof avg === "number") reviewsSummary.textContent = `Average: ${avg.toFixed(1)} / 5 (${count} review${count === 1 ? "" : "s"})`;
        else reviewsSummary.textContent = "";
    }
    if (reviewsModal) {
        reviewsModal.classList.add("open");
        reviewsModal.setAttribute("aria-hidden", "false");
    }
}

function closeReviewsModal() {
    if (!reviewsModal) return;
    reviewsModal.classList.remove("open");
    reviewsModal.setAttribute("aria-hidden", "true");
}

function setListEmpty(container, message) {
    if (!container) return;
    container.innerHTML = `<div class="bookings-empty">${message}</div>`;
}

function renderMyBookingsBookingsEmpty() {
    setListEmpty(myBookingsList, "No bookings yet. Book a room to generate your bill!");
}

function renderBillForBooking(booking, existingReview, options) {
    const allowReview = options && options.allowReview === false ? false : true;
    const normalized = normalizeBooking(booking);
    const roomType = normalized.roomType;
    const checkin = formatDateTime(normalized.checkin);
    const checkout = formatDateTime(normalized.checkout);
    const nights = normalized.nights;
    const featuresCost = formatINR(normalized.featuresCost);
    const totalAmount = formatINR(normalized.totalAmount);

    const selectedFeatures = normalized.features || [];
    const breakdownHtml = selectedFeatures.length
        ? `<ul>${selectedFeatures.map(k => `<li>${k} - ${formatINR(FEATURES[k])}</li>`).join("")}</ul>`
        : `<div>No features selected.</div>`;

    const reviewSection = (() => {
        if (!allowReview) return "";
        if (existingReview) {
            const ratingText = renderStars(existingReview.rating);
            const commentText = existingReview.comment || "";
            const createdAt = existingReview.createdAt ? new Date(existingReview.createdAt).toLocaleString("en-IN") : "-";
            return `
                <div class="review-form" style="background: rgba(255,255,255,0.55);">
                    <div class="review-meta">
                        <div class="stars-display" aria-label="Rating">${ratingText}</div>
                        <div>Submitted: ${createdAt}</div>
                    </div>
                    <p style="margin-top:10px; white-space: pre-wrap;">${escapeHtml(commentText)}</p>
                </div>
            `;
        }

        // Star-based rating input + comment textarea
        return `
            <div class="review-form" data-review-booking-id="${escapeHtml(normalized.id)}">
                <div class="review-meta">
                    <div class="star-input" role="radiogroup" aria-label="Rating">
                        ${[1, 2, 3, 4, 5].map(v => `<button type="button" class="star-btn" data-value="${v}" aria-label="${v} star">${"★"}</button>`).join("")}
                    </div>
                </div>
                <input type="hidden" class="review-rating-input" value="0" />
                <textarea class="review-comment" placeholder="Write your review..."></textarea>
                <div class="booking-actions" style="margin-top:12px;">
                    <button type="button" class="secondary-btn submit-review" data-review-booking-id="${escapeHtml(normalized.id)}">
                        Submit Review
                    </button>
                </div>
            </div>
        `;
    })();

    return `
        <div class="bill-card" data-bill-booking-id="${escapeHtml(normalized.id)}">
            <h3 style="text-align:left; margin-bottom:10px;">Bill for ${escapeHtml(roomType)}</h3>
            <table class="bookings-table bill-table">
                <thead>
                    <tr>
                        <th>Room Type</th>
                        <th>Check-in Date & Time</th>
                        <th>Check-out Date & Time</th>
                        <th>Total Nights</th>
                        <th>Features Cost</th>
                        <th>Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>${escapeHtml(roomType)}</strong></td>
                        <td>${escapeHtml(checkin)}</td>
                        <td>${escapeHtml(checkout)}</td>
                        <td>${escapeHtml(String(nights))}</td>
                        <td>${escapeHtml(featuresCost)}</td>
                        <td>${escapeHtml(totalAmount)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="features-breakdown">
                <strong>Selected Features Breakdown:</strong>
                ${breakdownHtml}
            </div>

            <div class="booking-actions" style="margin-top:14px;">
                <button type="button" class="secondary-btn download-bill" data-bill-booking-id="${escapeHtml(normalized.id)}">
                    Download Bill (PDF)
                </button>
            </div>

            ${reviewSection}
        </div>
    `;
}

function escapeHtml(str) {
    return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function fetchJson(url, options) {
    const res = await fetch(url, options);
    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed with status ${res.status}`);
    }
    return isJson ? res.json() : res.text();
}

async function loadMyBookingsAndReviews() {
    const user_id = getUserId();
    const localBookings = loadLocalBookings().map(normalizeBooking);

    // Start fast with local data.
    if (localBookings.length) {
        renderMyBookings(localBookings, {});
    } else {
        renderMyBookings([], {});
    }

    // Then try server sync.
    let serverBookings = [];
    try {
        const url = new URL(apiUrl("/api/bookings"), window.location.href);
        url.searchParams.set("user_id", user_id);
        serverBookings = (await fetchJson(url.toString(), { method: "GET" })).map(normalizeBooking);
    } catch (err) {
        console.warn("Could not load bookings from server:", err);
    }

    const mergedBookings = mergeBookings(localBookings, serverBookings);

    // Reviews (user-scoped)
    let serverReviews = [];
    try {
        const url = new URL(apiUrl("/api/reviews"), window.location.href);
        url.searchParams.set("user_id", user_id);
        serverReviews = await fetchJson(url.toString(), { method: "GET" });
    } catch (err) {
        console.warn("Could not load reviews from server:", err);
    }

    const localReviews = loadLocalReviews();
    const mergedReviews = mergeReviews(localReviews, serverReviews);

    const reviewByBookingId = {};
    mergedReviews.forEach(r => {
        if (!r.booking_id) return;
        // If the user submitted multiple times for some reason, keep the latest.
        if (!reviewByBookingId[r.booking_id] || new Date(r.createdAt).getTime() > new Date(reviewByBookingId[r.booking_id].createdAt).getTime()) {
            reviewByBookingId[r.booking_id] = r;
        }
    });

    renderMyBookings(mergedBookings, reviewByBookingId);
}

function mergeBookings(localBookings, serverBookings) {
    const byId = new Map();
    localBookings.forEach(b => byId.set(b.id, b));
    serverBookings.forEach(b => byId.set(b.id, b));
    return Array.from(byId.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

function mergeReviews(localReviews, serverReviews) {
    // Prefer server reviews. Add any local-only reviews not present server-side.
    const key = r => `${r.user_id || ""}:${r.booking_id || ""}`;
    const byKey = new Map();
    localReviews.forEach(r => byKey.set(key(r), r));
    serverReviews.forEach(r => byKey.set(key(r), r));
    return Array.from(byKey.values());
}

function renderMyBookings(bookings, reviewByBookingId) {
    if (!myBookingsList) return;
    persistBillCache(bookings);
    if (!bookings || bookings.length === 0) {
        myBookingsList.innerHTML = `<div class="bookings-empty">No bookings yet. Book a room to generate your bill and submit reviews.</div>`;
        return;
    }

    myBookingsList.innerHTML = bookings
        .slice(0, 30)
        .map(b => renderBillForBooking(b, reviewByBookingId ? reviewByBookingId[b.id] : null))
        .join("");
}

function downloadBillPdf(booking) {
    if (!booking) return;
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("PDF library not loaded. Try again.");
        return;
    }

    const normalized = normalizeBooking(booking);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const roomType = normalized.roomType;
    const checkin = formatDateTime(normalized.checkin);
    const checkout = formatDateTime(normalized.checkout);
    const nights = normalized.nights;
    const featuresCost = formatINR(normalized.featuresCost);
    const totalAmount = formatINR(normalized.totalAmount);

    const selectedFeatures = normalized.features || [];
    const breakdownLines = selectedFeatures.length
        ? selectedFeatures.map(k => `${k} - ${formatINR(FEATURES[k])}`)
        : ["No features selected."];

    doc.setFontSize(16);
    doc.text("LuxuryStay - Booking Bill", 40, 30);
    doc.setFontSize(10);
    doc.text(`Booking ID: ${normalized.id}`, 40, 48);

    const head = [["Room Type", "Check-in Date & Time", "Check-out Date & Time", "Total Nights", "Features Cost", "Total Amount"]];
    const body = [[roomType, checkin, checkout, String(nights), featuresCost, totalAmount]];

    if (typeof doc.autoTable === "function") {
        doc.autoTable({
            startY: 60,
            head,
            body,
            theme: "grid",
            styles: { fontSize: 9, cellPadding: 5 },
            headStyles: { fillColor: [212, 175, 55] }
        });

        const finalY = doc.lastAutoTable.finalY || 100;
        doc.setFontSize(12);
        doc.text("Selected Features Breakdown:", 40, finalY + 22);
        doc.setFontSize(10);
        const startBreakY = finalY + 36;
        breakdownLines.forEach((line, i) => {
            doc.text(line, 60, startBreakY + i * 14);
        });
    } else {
        // Fallback: no autoTable plugin loaded.
        doc.setFontSize(11);
        doc.text("Bill (table view requires jsPDF autotable plugin).", 40, 80);
        doc.text(`Room Type: ${roomType}`, 40, 100);
        doc.text(`Check-in: ${checkin}`, 40, 116);
        doc.text(`Check-out: ${checkout}`, 40, 132);
        doc.text(`Total Nights: ${nights}`, 40, 148);
        doc.text(`Features Cost: ${featuresCost}`, 40, 164);
        doc.text(`Total Amount: ${totalAmount}`, 40, 180);
    }

    doc.save(`LuxuryStay_Bill_${normalized.id}.pdf`);
}

async function submitReviewForBooking({ bookingId, rating, comment }) {
    const user_id = getUserId();
    const payload = { user_id, booking_id: bookingId, rating, comment };

    try {
        const data = await fetchJson(apiUrl("/api/reviews"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        return { review: data, usedServer: true };
    } catch (err) {
        // Development fallback: save locally if backend is unreachable.
        const localReviews = loadLocalReviews();
        const booking = loadLocalBookings().find(b => b.id === bookingId) || {};
        const localReview = {
            id: `local-${Date.now()}`,
            user_id,
            booking_id: bookingId,
            roomType: booking.roomType,
            rating,
            comment,
            createdAt: new Date().toISOString()
        };
        localReviews.unshift(localReview);
        saveLocalReviews(localReviews);
        return { review: localReview, usedServer: false, error: err.message || String(err) };
    }
}

async function refreshRoomRatings() {
    const ratingElems = document.querySelectorAll(".room-rating");
    if (!ratingElems.length) return;

    try {
        const url = new URL(apiUrl("/api/rooms/ratings"), window.location.href);
        const data = await fetchJson(url.toString(), { method: "GET" });
        const ratings = data?.ratings || {};
        ratingElems.forEach(el => {
            const roomType = el.getAttribute("data-room");
            const r = ratings[roomType];
            if (!r) {
                el.textContent = "No ratings yet.";
                return;
            }
            const avg = typeof r.averageRating === "number" ? r.averageRating : 0;
            const count = r.count || 0;
            el.textContent = `Avg: ${avg.toFixed(1)} / 5 (${count})`;
        });
    } catch (err) {
        console.warn("Room ratings not loaded:", err);
        ratingElems.forEach(el => {
            const roomType = el.getAttribute("data-room");
            el.textContent = "Ratings unavailable";
        });
    }
}

async function loadRoomReviews(roomType) {
    if (!roomType) return;
    if (!reviewsList) return;
    reviewsList.innerHTML = `<div class="bookings-empty">Loading reviews...</div>`;
    try {
        const url = new URL(apiUrl("/api/reviews"), window.location.href);
        url.searchParams.set("roomType", roomType);
        const data = await fetchJson(url.toString(), { method: "GET" });
        const avg = typeof data.averageRating === "number" ? data.averageRating : 0;
        const count = data.count || 0;
        openReviewsModal(roomType, avg, count);

        const reviews = Array.isArray(data.reviews) ? data.reviews : [];
        if (!reviews.length) {
            reviewsList.innerHTML = `<div class="bookings-empty">No reviews yet.</div>`;
            return;
        }

        reviewsList.innerHTML = reviews
            .slice(0, 50)
            .map(r => {
                const stars = renderStars(r.rating);
                const createdAt = r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : "-";
                const comment = r.comment || "";
                return `
                    <li class="review-item">
                        <div class="review-meta">
                            <div class="stars-display" aria-label="Rating">${stars}</div>
                            <div>${escapeHtml(createdAt)}</div>
                        </div>
                        <p style="margin-top:10px; white-space: pre-wrap;">${escapeHtml(comment)}</p>
                    </li>
                `;
            })
            .join("");
    } catch (err) {
        console.error("Room reviews error:", err);
        reviewsList.innerHTML = `<div class="bookings-empty">Could not load reviews. Is the backend running?</div>`;
        openReviewsModal(roomType, 0, 0);
    }
}

function setupModalBehaviors() {
    detailsCloseButton?.addEventListener("click", closeDetailsModal);
    detailsModal?.addEventListener("click", function (e) {
        if (e.target === detailsModal) closeDetailsModal();
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            closeDetailsModal();
            closeReviewsModal();
        }
    });

    reviewsCloseButton?.addEventListener("click", closeReviewsModal);
    reviewsModal?.addEventListener("click", function (e) {
        if (e.target === reviewsModal) closeReviewsModal();
    });
}

function setupSmoothScroll() {
    document.querySelectorAll("a[href^='#']").forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            const href = this.getAttribute("href");
            if (!href) return;
            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();

            const navbar = document.querySelector(".navbar");
            const navbarHeight = navbar ? navbar.offsetHeight : 0;
            const top = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
            window.scrollTo({ top, behavior: "smooth" });
        });
    });
}

function setupBookingForm() {
    if (!bookingForm) return;

    // Live feature cost updates
    document.querySelectorAll(".booking-feature").forEach(input => {
        input.addEventListener("change", updateFeaturesCostText);
    });
    updateFeaturesCostText();

    bookingForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const user_id = getUserId();

        const checkin = document.getElementById("checkin")?.value;
        const checkout = document.getElementById("checkout")?.value;
        const guests = document.getElementById("guests")?.value;
        const roomType = document.getElementById("roomType")?.value;

        if (!checkin || !checkout || !guests || !roomType) {
            alert("All fields are required.");
            setBookingMessage("All fields are required.", true);
            return;
        }

        if (!ROOM_DETAILS[roomType]) {
            alert("Please select a valid room type.");
            setBookingMessage("Please select a valid room type.", true);
            return;
        }

        const nights = computeNights(checkin, checkout);
        if (!nights) {
            alert("Check-out must be after check-in date/time.");
            setBookingMessage("Check-out must be after check-in date/time.", true);
            return;
        }

        const guestsNumber = Number(guests);
        if (!Number.isFinite(guestsNumber) || guestsNumber < 1) {
            alert("Guests must be at least 1.");
            setBookingMessage("Guests must be at least 1.", true);
            return;
        }

        const selectedFeatures = getSelectedFeaturesFromForm();
        const featuresCost = selectedFeatures.reduce((sum, key) => sum + (FEATURES[key] || 0), 0);
        const roomTotalPrice = nights * ROOM_DETAILS[roomType].pricePerNight;
        const totalAmount = roomTotalPrice + featuresCost;

        const submitButton = bookingForm.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;
        setBookingMessage("Confirming your reservation...", false);

        const payload = {
            user_id,
            checkin,
            checkout,
            guests: guestsNumber,
            roomType,
            nights,
            features: selectedFeatures,
            featuresCost,
            roomTotalPrice,
            totalAmount
        };

        try {
            const data = await fetchJson(apiUrl("/api/bookings"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            alert(`Reservation Confirmed! Total: ${formatINR(totalAmount)}.`);
            setBookingMessage(`Booked for ${nights} night(s). Total: ${formatINR(totalAmount)}.`, false);
            saveBookingToLocalStorage(data);
            await loadMyBookingsAndReviews();
        } catch (err) {
            // If backend is not running, still confirm and persist locally.
            console.warn("Booking API error:", err);
            alert(`Reservation Confirmed! Total: ${formatINR(totalAmount)}.`);
            const localBooking = {
                id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                createdAt: new Date().toISOString(),
                user_id,
                checkin,
                checkout,
                guests: guestsNumber,
                roomType,
                nights,
                features: selectedFeatures,
                featuresCost,
                roomTotalPrice,
                totalAmount
            };
            saveBookingToLocalStorage(localBooking);
            setBookingMessage("Reservation saved locally (backend not reachable).", true);
            await loadMyBookingsAndReviews();
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

function setupDetailsButtons() {
    document.querySelectorAll(".view-details").forEach(btn => {
        btn.addEventListener("click", function () {
            const roomType = this.dataset.room;
            openDetailsModal(roomType, this);
        });
    });
}

function setupReviewsButtons() {
    document.querySelectorAll(".view-reviews").forEach(btn => {
        btn.addEventListener("click", function () {
            const roomType = this.dataset.room;
            loadRoomReviews(roomType);
        });
    });
}

function setupMyBookingsInteractions() {
    // Event delegation for star selection + submit review + download bill
    myBookingsList?.addEventListener("click", async function (e) {
        const starBtn = e.target.closest(".star-btn");
        if (starBtn) {
            const formEl = starBtn.closest(".review-form[data-review-booking-id]");
            if (!formEl) return;
            const ratingInput = formEl.querySelector(".review-rating-input");
            const val = Number(starBtn.dataset.value);
            if (!Number.isFinite(val)) return;

            // Update UI
            formEl.querySelectorAll(".star-btn").forEach(b => b.classList.remove("selected"));
            for (const b of Array.from(formEl.querySelectorAll(".star-btn"))) {
                if (Number(b.dataset.value) <= val) b.classList.add("selected");
            }
            if (ratingInput) ratingInput.value = String(val);
            return;
        }

        const submitBtn = e.target.closest(".submit-review");
        if (submitBtn) {
            const bookingId = submitBtn.dataset.reviewBookingId || submitBtn.dataset.reviewBookingId;
            const reviewForm = submitBtn.closest(".review-form");
            if (!reviewForm) return;
            const rating = Number(reviewForm.querySelector(".review-rating-input")?.value || "0");
            const comment = reviewForm.querySelector(".review-comment")?.value || "";

            if (!rating || rating < 1 || rating > 5) {
                alert("Please select a rating from 1 to 5 stars.");
                return;
            }

            if (!comment.trim()) {
                alert("Please write a short review comment.");
                return;
            }

            submitBtn.disabled = true;
            try {
                const { review } = await submitReviewForBooking({ bookingId: bookingId, rating, comment: comment.trim() });
                // Update UI by reloading.
                await loadMyBookingsAndReviews();
                await refreshRoomRatings();
                alert("Thanks! Your review has been submitted.");
            } catch (err) {
                console.error(err);
                alert("Could not submit review. Please try again.");
            } finally {
                submitBtn.disabled = false;
            }
        }

        // Download is handled by setupMyBookingsInteractionsFinal() to avoid double-PDF generation.
    });
}

window.__luxurystay_booking_cache = window.__luxurystay_booking_cache || [];
function persistBillCache(bookings) {
    window.__luxurystay_booking_cache = Array.isArray(bookings) ? bookings : [];
}

function cacheBookingFind(bookingId) {
    const cache = window.__luxurystay_booking_cache || [];
    return cache.find(b => b.id === bookingId) || null;
}

function setupMyBookingsInteractionsFinal() {
    myBookingsList?.addEventListener("click", async function (e) {
        const downloadBtn = e.target.closest(".download-bill");
        if (!downloadBtn) return;

        const bookingId = downloadBtn.dataset.billBookingId;
        const booking = cacheBookingFind(bookingId);
        if (!booking) {
            alert("Booking not found. Try refreshing your bookings.");
            return;
        }
        downloadBillPdf(booking);
    });
}

async function init() {
    setupModalBehaviors();
    setupSmoothScroll();
    setupBookingForm();
    setupDetailsButtons();
    setupReviewsButtons();
    setupMyBookingsInteractions();
    setupMyBookingsInteractionsFinal();

    // Admin controls (enable via ?admin=1)
    const adminParam = new URLSearchParams(window.location.search).get("admin");
    const shouldShowAdmin = adminParam === "1";
    const adminSection = document.getElementById("admin-bookings");
    const adminNavLink = document.querySelector(".admin-link");

    if (adminSection && !shouldShowAdmin) adminSection.setAttribute("hidden", "");
    if (adminNavLink && !shouldShowAdmin) adminNavLink.style.display = "none";
    if (adminSection && shouldShowAdmin) adminSection.removeAttribute("hidden");
    if (adminNavLink && shouldShowAdmin) adminNavLink.style.display = "";

    loadAdminBookingsButton?.addEventListener("click", function () {
        loadAdminBookings();
    });

    adminLoginButton?.addEventListener("click", async function () {
        if (!adminEmailInput || !adminPasswordInput) return;

        const email = adminEmailInput.value.trim();
        const password = adminPasswordInput.value || "";

        if (!email || !password) {
            if (adminAuthMessage) {
                adminAuthMessage.textContent = "Enter email and password.";
                adminAuthMessage.style.display = "block";
            }
            return;
        }

        if (adminAuthMessage) {
            adminAuthMessage.textContent = "Logging in...";
            adminAuthMessage.style.display = "block";
        }

        try {
            const adminLoginApiUrl = apiUrl("/api/admin/login");
            const res = await fetch(adminLoginApiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) {
                const errText = await res.text().catch(() => "");
                throw new Error(errText || `Login failed with status ${res.status}`);
            }
            const data = await res.json();
            if (!data || !data.token) throw new Error("No token returned.");
            localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
            if (adminAuthWrap) adminAuthWrap.style.display = "none";
            if (adminAuthMessage) adminAuthMessage.style.display = "none";
            await loadAdminBookings();
        } catch (err) {
            console.error("Admin login error:", err);
            if (adminAuthMessage) {
                adminAuthMessage.textContent = "Login failed. Check credentials and try again.";
                adminAuthMessage.style.display = "block";
            }
        }
    });

    refreshMyBookingsButton?.addEventListener("click", async function () {
        await loadMyBookingsAndReviews();
    });

    clearMyBookingsButton?.addEventListener("click", async function () {
        try {
            localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, "[]");
            // Also clear local reviews, so the UI stays consistent.
            saveLocalReviews([]);
            await loadMyBookingsAndReviews();
            setBookingMessage("Cleared your local bookings.", false);
        } catch (err) {
            console.error("Clear local bookings error:", err);
            setBookingMessage("Could not clear local bookings.", true);
        }
    });

    await refreshRoomRatings();
    await loadMyBookingsAndReviews();
}

async function loadAdminBookings() {
    if (!adminBookingsList) return;
    adminBookingsList.innerHTML = `<div class="bookings-empty">Loading bookings from server...</div>`;

    try {
        const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY) || "";
        const url = apiUrl("/api/bookings");
        const res = await fetch(url, {
            method: "GET",
            headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
        });

        if (!res.ok) {
            if (res.status === 401) {
                if (adminAuthWrap) adminAuthWrap.style.display = "";
                if (adminAuthMessage) {
                    adminAuthMessage.textContent = "Please login to view admin bookings.";
                    adminAuthMessage.style.display = "block";
                }
                setListEmpty(adminBookingsList, "Unauthorized. Login required.");
                return;
            }
            const errText = await res.text().catch(() => "");
            throw new Error(errText || `Request failed with status ${res.status}`);
        }

        const data = await res.json();
        if (adminAuthWrap) adminAuthWrap.style.display = "none";
        if (adminAuthMessage) adminAuthMessage.style.display = "none";

        // Reuse bill renderer for consistent output.
        const bookings = Array.isArray(data) ? data.map(normalizeBooking) : [];
        persistBillCache(bookings);
        const emptyReviewsMap = {};
        adminBookingsList.innerHTML = bookings.length
            ? bookings.slice(0, 20).map(b => renderBillForBooking(b, emptyReviewsMap[b.id] || null, { allowReview: false })).join("")
            : `<div class="bookings-empty">No bookings found.</div>`;
    } catch (err) {
        console.error("Admin load error:", err);
        setListEmpty(adminBookingsList, "Could not load from server. Is the backend running?");
    }
}

// Initialize once DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

// Booking cache is populated inside renderMyBookings()

