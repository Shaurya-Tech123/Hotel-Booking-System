import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <section className="hero">
      <div className="hero-content">
        <p className="eyebrow">Hotel Booking System</p>
        <h1>Book premium stays with confidence</h1>
        <p>Separate admin and user portals with secure JWT authentication, real-time availability, and instant PDF invoices.</p>
        <div className="hero-actions">
          <Link className="btn-primary" to="/user/register">
            User Register
          </Link>
          <Link className="btn-secondary" to="/admin/register">
            Admin Register
          </Link>
        </div>
      </div>
    </section>
  );
}
