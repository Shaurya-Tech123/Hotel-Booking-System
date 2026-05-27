import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { toast } from "react-toastify";
import { getDashboardAnalytics } from "../services/analyticsApi";

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const analytics = await getDashboardAnalytics();
        setData(analytics);
      } catch (err) {
        toast.error(err.response?.data?.error || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner" />
        <p>Loading analytics from MongoDB...</p>
      </div>
    );
  }

  if (!data) return <p className="muted">No analytics data available.</p>;

  const { summary, charts } = data;

  return (
    <div className="analytics-section">
      <h2>Analytics Dashboard</h2>
      <p className="subtitle">Real-time insights from bookings and reviews</p>

      <div className="stats-grid">
        <div className="stat-card stat-card--primary">
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value">INR {summary.totalRevenue?.toLocaleString("en-IN") ?? 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Bookings</span>
          <span className="stat-value">{summary.totalBookings ?? 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Hotels Listed</span>
          <span className="stat-value">{summary.totalHotels ?? 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Top Hotel</span>
          <span className="stat-value stat-value--sm">
            {summary.mostBookedHotel?.name ?? "—"}
            {summary.mostBookedHotel ? ` (${summary.mostBookedHotel.bookings})` : ""}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Top Room Category</span>
          <span className="stat-value stat-value--sm">
            {summary.mostBookedRoom?.category ?? "—"}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Top City</span>
          <span className="stat-value stat-value--sm">{summary.mostBookedCity?.city ?? "—"}</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <h3>Most Booked Hotels</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.topHotels}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Most Booked Room Categories</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.topRoomCategories}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Most Booked Cities</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.topCities}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Most Selected Features</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.topFeatures} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="feature" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card chart-card--wide">
          <h3>Monthly Bookings & Revenue (INR)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts.monthlyBookings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(v, name) => (name === "revenue" ? `INR ${v}` : v)} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
