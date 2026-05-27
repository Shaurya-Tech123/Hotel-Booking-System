import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import StarRating, { RatingSummary } from "../components/StarRating";
import { getImageUrl } from "../utils/imageUrl";
import { searchHotels, createBooking, getMyBookings, downloadBill } from "../services/bookingsApi";
import { addReview } from "../services/reviewsApi";

export default function UserDashboard() {
  const { profile } = useSelector(state => state.auth);
  const [search, setSearch] = useState({ city: "", checkIn: "", checkOut: "" });
  const [results, setResults] = useState(null);
  const [nights, setNights] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [reviewForms, setReviewForms] = useState({});
  const [loading, setLoading] = useState(false);
  const [billLoading, setBillLoading] = useState(null);

  const getReviewForm = hotelId =>
    reviewForms[hotelId] || { rating: 5, comment: "" };

  const setReviewFormFor = (hotelId, patch) => {
    setReviewForms(prev => ({
      ...prev,
      [hotelId]: { ...getReviewForm(hotelId), ...patch }
    }));
  };

  const loadBookings = async () => {
    setBookingsLoading(true);
    try {
      const data = await getMyBookings();
      setBookings(data.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleSearch = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await searchHotels(search);
      setResults(data.hotels || []);
      setNights(data.nights || 0);
      setSelectedHotel(null);
      setSelectedRoom(null);
      if (!data.hotels?.length) toast.info("No hotels found in this city for selected dates");
    } catch (err) {
      toast.error(err.response?.data?.error || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (room, featureName) => {
    const feature = room.features.find(f => f.name === featureName);
    if (!feature) return;
    setSelectedFeatures(prev => {
      const exists = prev.find(f => f.name === featureName);
      if (exists) return prev.filter(f => f.name !== featureName);
      return [...prev, { name: feature.name, price: feature.price }];
    });
  };

  const calculatePreview = () => {
    if (!selectedRoom || !nights) return 0;
    const roomTotal = selectedRoom.pricePerDay * nights;
    const featuresTotal = selectedFeatures.reduce((s, f) => s + f.price, 0);
    return roomTotal + featuresTotal;
  };

  const handleBooking = async () => {
    if (!selectedHotel || !selectedRoom) return toast.warn("Select a hotel and room");
    setLoading(true);
    try {
      await createBooking({
        hotelId: selectedHotel.hotel._id,
        roomId: selectedRoom._id,
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        selectedFeatures
      });
      toast.success("Booking confirmed! Download your bill from My Bookings.");
      setSelectedFeatures([]);
      setSelectedRoom(null);
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.error || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const refreshSearch = async () => {
    if (!search.city || !search.checkIn || !search.checkOut) return;
    setLoading(true);
    try {
      const data = await searchHotels(search);
      setResults(data.hotels || []);
      setNights(data.nights || 0);
    } catch (err) {
      toast.error(err.response?.data?.error || "Refresh failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async hotelId => {
    const form = getReviewForm(hotelId);
    if (!form.comment.trim()) return toast.warn("Write a review comment");
    if (!form.rating) return toast.warn("Select a star rating");
    try {
      await addReview({ hotelId, rating: Number(form.rating), comment: form.comment });
      toast.success("Review submitted");
      setReviewFormFor(hotelId, { rating: 5, comment: "" });
      await refreshSearch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not submit review");
    }
  };

  const handleDownloadBill = async bookingId => {
    setBillLoading(bookingId);
    try {
      await downloadBill(bookingId);
      toast.success("Bill downloaded");
    } catch (err) {
      toast.error(err.response?.data?.error || "Download failed");
    } finally {
      setBillLoading(null);
    }
  };

  const hotelCover = item => {
    const roomImg = item.allRooms?.find(r => r.images?.length)?.images[0];
    const hotelImg = item.hotel.images?.[0];
    return getImageUrl(roomImg || hotelImg);
  };

  return (
    <div className="dashboard container">
      <h1>Welcome, {profile?.username}</h1>
      <p className="subtitle">Search hotels, book rooms, and manage your stays</p>

      <section className="card search-card">
        <h3>Find Hotels</h3>
        <form className="search-form" onSubmit={handleSearch}>
          <input type="date" value={search.checkIn} onChange={e => setSearch(s => ({ ...s, checkIn: e.target.value }))} required />
          <input type="date" value={search.checkOut} onChange={e => setSearch(s => ({ ...s, checkOut: e.target.value }))} required />
          <input placeholder="City / Location" value={search.city} onChange={e => setSearch(s => ({ ...s, city: e.target.value }))} required />
          <button className="btn-primary" disabled={loading}>
            {loading ? "Searching..." : "Search Hotels"}
          </button>
        </form>
        {nights > 0 ? <p className="tip">{nights} night(s) selected</p> : null}
      </section>

      {loading && !results ? (
        <div className="analytics-loading">
          <div className="spinner" />
          <p>Searching hotels...</p>
        </div>
      ) : null}

      {results?.map(item => (
        <section key={item.hotel._id} className="card hotel-card">
          <div className="hotel-card-head">
            <div className="hotel-card-info">
              {hotelCover(item) ? <img src={hotelCover(item)} alt={item.hotel.name} className="hotel-card-cover" /> : null}
              <div>
                <h3>{item.hotel.name}</h3>
                <p>
                  {item.hotel.address}, {item.hotel.city}
                </p>
                <RatingSummary averageRating={item.rating} reviewCount={item.reviewCount} />
              </div>
            </div>
            <button
              className="btn-secondary"
              onClick={() => {
                setSelectedHotel(item);
                setSelectedRoom(null);
                setSelectedFeatures([]);
              }}
            >
              Book Here
            </button>
          </div>

          <div className="rooms-grid">
            {item.allRooms.map(room => (
              <article key={room._id} className={`room-card ${room.isAvailable ? "" : "unavailable"}`}>
                {room.images?.[0] ? (
                  <img src={getImageUrl(room.images[0])} alt={room.category} />
                ) : (
                  <div className="img-placeholder">{room.category}</div>
                )}
                <h4>{room.category}</h4>
                <p>INR {room.pricePerDay} / night</p>
                <p>Available: {room.availability}</p>
                <p className="muted">{room.description || "Premium comfort stay"}</p>
                <div className="tags">
                  {room.features?.map(f => (
                    <span key={f.name} className="tag">
                      {f.name} (+INR {f.price})
                    </span>
                  ))}
                </div>
                {room.isAvailable ? (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setSelectedHotel(item);
                      setSelectedRoom(room);
                      setSelectedFeatures([]);
                    }}
                  >
                    Select Room
                  </button>
                ) : (
                  <span className="badge-unavailable">Not available</span>
                )}
              </article>
            ))}
          </div>

          <div className="reviews-block">
            <h4>Guest Reviews</h4>
            {item.reviews?.length ? (
              item.reviews.map((r, i) => (
                <div key={i} className="review-item">
                  <div className="review-item-head">
                    <strong>{r.username}</strong>
                    <StarRating value={r.rating} mode="display" size="sm" />
                  </div>
                  <p>{r.comment}</p>
                  <small>{new Date(r.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</small>
                </div>
              ))
            ) : (
              <p className="muted">No reviews yet — be the first!</p>
            )}
            <div className="review-form">
              <label>Your rating</label>
              <StarRating
                value={getReviewForm(item.hotel._id).rating}
                mode="input"
                size="lg"
                onChange={rating => setReviewFormFor(item.hotel._id, { rating })}
              />
              <textarea
                placeholder="Share your experience..."
                value={getReviewForm(item.hotel._id).comment}
                onChange={e => setReviewFormFor(item.hotel._id, { comment: e.target.value })}
              />
              <button className="btn-secondary" onClick={() => handleReview(item.hotel._id)}>
                Submit Review
              </button>
            </div>
          </div>
        </section>
      ))}

      {selectedHotel && selectedRoom ? (
        <section className="card booking-panel">
          <h3>Complete Booking — {selectedHotel.hotel.name}</h3>
          <p>
            Room: <strong>{selectedRoom.category}</strong> · INR {selectedRoom.pricePerDay}/night × {nights} nights
          </p>
          <h4>Add-on Features</h4>
          <div className="features-grid">
            {selectedRoom.features?.map(f => (
              <label key={f.name} className="feature-chip">
                <input
                  type="checkbox"
                  checked={selectedFeatures.some(sf => sf.name === f.name)}
                  onChange={() => toggleFeature(selectedRoom, f.name)}
                />
                <span>
                  {f.name} (+INR {f.price})
                </span>
              </label>
            ))}
          </div>
          <p className="total-preview">Estimated total: INR {calculatePreview()}</p>
          <button className="btn-primary" onClick={handleBooking} disabled={loading}>
            {loading ? "Booking..." : "Confirm Booking"}
          </button>
        </section>
      ) : null}

      <section className="card">
        <h3>My Bookings</h3>
        {bookingsLoading ? <p className="muted">Loading bookings...</p> : null}
        {!bookingsLoading && bookings.length === 0 ? <p>No bookings yet.</p> : null}
        {bookings.map(b => (
          <div key={b._id} className="booking-row">
            <div>
              <strong>{b.hotelName}</strong> — {b.roomCategory}
              <p>
                {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()} ({b.nights} nights)
              </p>
              <p>Total: INR {b.totalBill}</p>
            </div>
            <button className="btn-secondary" onClick={() => handleDownloadBill(b._id)} disabled={billLoading === b._id}>
              {billLoading === b._id ? "Downloading..." : "Download PDF Bill"}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
