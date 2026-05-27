import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FEATURE_OPTIONS, ROOM_CATEGORIES } from "../constants";
import ImageUpload from "../components/ImageUpload";
import AdminAnalytics from "../components/AdminAnalytics";
import { getImageUrl } from "../utils/imageUrl";
import {
  createHotel,
  deleteHotel,
  getHotel,
  getHotels,
  updateAvailability,
  updateHotel,
  upsertRoom
} from "../services/hotelsApi";

const emptyHotel = { name: "", address: "", city: "", totalRooms: "", images: [] };
const emptyRoom = {
  category: "Single Suite",
  pricePerDay: "",
  availability: "",
  description: "",
  imageUrls: [],
  features: FEATURE_OPTIONS.map(name => ({ name, price: 0, selected: false }))
};

export default function AdminDashboard() {
  const [tab, setTab] = useState("manage");
  const [hotels, setHotels] = useState([]);
  const [hotelForm, setHotelForm] = useState(emptyHotel);
  const [roomForm, setRoomForm] = useState(emptyRoom);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [editHotelId, setEditHotelId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadHotels = async () => {
    try {
      const data = await getHotels();
      setHotels(data.hotels || []);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to load hotels");
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  const resetRoomForm = () => setRoomForm(emptyRoom);

  const handleCreateHotel = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await createHotel({
        name: hotelForm.name,
        address: hotelForm.address,
        city: hotelForm.city,
        totalRooms: Number(hotelForm.totalRooms),
        images: hotelForm.images,
        rooms: []
      });
      toast.success("Hotel added");
      setHotelForm(emptyHotel);
      loadHotels();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add hotel");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHotel = async id => {
    setLoading(true);
    try {
      await updateHotel(id, {
        name: hotelForm.name,
        address: hotelForm.address,
        city: hotelForm.city,
        totalRooms: Number(hotelForm.totalRooms),
        images: hotelForm.images
      });
      toast.success("Hotel updated");
      setEditHotelId(null);
      setHotelForm(emptyHotel);
      loadHotels();
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHotel = async id => {
    if (!window.confirm("Delete this hotel and all its rooms?")) return;
    try {
      await deleteHotel(id);
      toast.success("Hotel deleted");
      loadHotels();
    } catch (err) {
      toast.error(err.response?.data?.error || "Delete failed");
    }
  };

  const handleSaveRoom = async e => {
    e.preventDefault();
    if (!selectedHotelId) return toast.warn("Select a hotel first");
    setLoading(true);
    try {
      const features = roomForm.features
        .filter(f => f.selected)
        .map(f => ({ name: f.name, price: Number(f.price) || 0 }));

      await upsertRoom(selectedHotelId, {
        category: roomForm.category,
        pricePerDay: Number(roomForm.pricePerDay),
        availability: Number(roomForm.availability),
        description: roomForm.description,
        images: roomForm.imageUrls,
        features
      });
      toast.success("Room saved");
      resetRoomForm();
      loadHotels();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save room");
    } finally {
      setLoading(false);
    }
  };

  const handleAvailability = async (roomId, value) => {
    try {
      await updateAvailability(roomId, Number(value));
      toast.success("Availability updated");
      loadHotels();
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed");
    }
  };

  const startEdit = hotel => {
    setEditHotelId(hotel._id);
    setHotelForm({
      name: hotel.name,
      address: hotel.address,
      city: hotel.city,
      totalRooms: String(hotel.totalRooms),
      images: hotel.images || []
    });
  };

  const toggleFeature = name => {
    setRoomForm(r => ({
      ...r,
      features: r.features.map(f => (f.name === name ? { ...f, selected: !f.selected } : f))
    }));
  };

  const setFeaturePrice = (name, price) => {
    setRoomForm(r => ({
      ...r,
      features: r.features.map(f => (f.name === name ? { ...f, price } : f))
    }));
  };

  return (
    <div className="dashboard container">
      <div className="dashboard-tabs">
        <button type="button" className={tab === "manage" ? "tab active" : "tab"} onClick={() => setTab("manage")}>
          Manage Hotels
        </button>
        <button type="button" className={tab === "analytics" ? "tab active" : "tab"} onClick={() => setTab("analytics")}>
          Analytics
        </button>
      </div>

      {tab === "analytics" ? <AdminAnalytics /> : null}

      {tab === "manage" ? (
        <>
          <h1>Admin Dashboard</h1>
          <p className="subtitle">Manage hotels, upload images, room categories, pricing, and availability</p>

          <div className="dashboard-grid">
            <section className="card">
              <h3>{editHotelId ? "Edit Hotel" : "Add Hotel"}</h3>
              <form
                onSubmit={
                  editHotelId
                    ? e => {
                        e.preventDefault();
                        handleUpdateHotel(editHotelId);
                      }
                    : handleCreateHotel
                }
              >
                <input placeholder="Hotel name" value={hotelForm.name} onChange={e => setHotelForm(f => ({ ...f, name: e.target.value }))} required />
                <input placeholder="Address" value={hotelForm.address} onChange={e => setHotelForm(f => ({ ...f, address: e.target.value }))} required />
                <input placeholder="City / Location" value={hotelForm.city} onChange={e => setHotelForm(f => ({ ...f, city: e.target.value }))} required />
                <input type="number" placeholder="Total rooms" value={hotelForm.totalRooms} onChange={e => setHotelForm(f => ({ ...f, totalRooms: e.target.value }))} required />
                <ImageUpload
                  type="hotel"
                  label="Hotel images"
                  value={hotelForm.images}
                  onChange={urls => setHotelForm(f => ({ ...f, images: urls }))}
                />
                <button className="btn-primary" disabled={loading}>
                  {loading ? "Saving..." : editHotelId ? "Update Hotel" : "Add Hotel"}
                </button>
                {editHotelId ? (
                  <button type="button" className="btn-secondary" onClick={() => { setEditHotelId(null); setHotelForm(emptyHotel); }}>
                    Cancel Edit
                  </button>
                ) : null}
              </form>
            </section>

            <section className="card">
              <h3>Manage Room Category</h3>
              <select value={selectedHotelId} onChange={e => setSelectedHotelId(e.target.value)}>
                <option value="">Select hotel</option>
                {hotels.map(h => (
                  <option key={h._id} value={h._id}>
                    {h.name} — {h.city}
                  </option>
                ))}
              </select>
              <form onSubmit={handleSaveRoom}>
                <select value={roomForm.category} onChange={e => setRoomForm(f => ({ ...f, category: e.target.value }))}>
                  {ROOM_CATEGORIES.map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <input type="number" placeholder="Price per day (INR)" value={roomForm.pricePerDay} onChange={e => setRoomForm(f => ({ ...f, pricePerDay: e.target.value }))} required />
                <input type="number" placeholder="Availability count" value={roomForm.availability} onChange={e => setRoomForm(f => ({ ...f, availability: e.target.value }))} required />
                <textarea placeholder="Room description (optional)" value={roomForm.description} onChange={e => setRoomForm(f => ({ ...f, description: e.target.value }))} />
                <ImageUpload
                  type="room"
                  label="Room images"
                  value={roomForm.imageUrls}
                  onChange={urls => setRoomForm(f => ({ ...f, imageUrls: urls }))}
                />
                <div className="features-grid">
                  {roomForm.features.map(f => (
                    <label key={f.name} className="feature-chip">
                      <input type="checkbox" checked={f.selected} onChange={() => toggleFeature(f.name)} />
                      <span>{f.name}</span>
                      {f.selected ? (
                        <input type="number" placeholder="INR" value={f.price} onChange={e => setFeaturePrice(f.name, e.target.value)} />
                      ) : null}
                    </label>
                  ))}
                </div>
                <button className="btn-primary" disabled={loading}>
                  {loading ? "Saving..." : "Save Room"}
                </button>
              </form>
            </section>
          </div>

          <section className="card">
            <h3>Hotels List</h3>
            {hotels.length === 0 ? <p>No hotels yet. Add your first property above.</p> : null}
            {hotels.map(hotel => (
              <div key={hotel._id} className="hotel-item">
                <div className="hotel-head">
                  <div>
                    <h4>{hotel.name}</h4>
                    <p>
                      {hotel.address}, {hotel.city} · {hotel.totalRooms} total rooms
                    </p>
                    {hotel.images?.length ? (
                      <div className="image-preview-grid image-preview-grid--inline">
                        {hotel.images.map(url => (
                          <img key={url} src={getImageUrl(url)} alt={hotel.name} className="hotel-thumb" />
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="actions">
                    <button className="btn-secondary" onClick={() => startEdit(hotel)}>
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => handleDeleteHotel(hotel._id)}>
                      Delete
                    </button>
                  </div>
                </div>
                <HotelRooms hotelId={hotel._id} onAvailability={handleAvailability} />
              </div>
            ))}
          </section>
        </>
      ) : null}
    </div>
  );
}

function HotelRooms({ hotelId, onAvailability }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getHotel(hotelId);
        setRooms(data.rooms || []);
      } catch {
        setRooms([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [hotelId]);

  if (loading) return <p className="muted">Loading rooms...</p>;
  if (!rooms.length) return <p className="muted">No room categories configured yet.</p>;

  return (
    <div className="rooms-list">
      {rooms.map(room => (
        <div key={room._id} className="room-row">
          <div className="room-row-main">
            {room.images?.[0] ? <img src={getImageUrl(room.images[0])} alt={room.category} className="room-thumb" /> : null}
            <div>
              <strong>{room.category}</strong> — INR {room.pricePerDay}/day
              <br />
              <span className="muted">Features: {room.features?.map(f => f.name).join(", ") || "None"}</span>
            </div>
          </div>
          <label>
            Availability:
            <input type="number" defaultValue={room.availability} onBlur={e => onAvailability(room._id, e.target.value)} style={{ width: 70, marginLeft: 8 }} />
          </label>
        </div>
      ))}
    </div>
  );
}
