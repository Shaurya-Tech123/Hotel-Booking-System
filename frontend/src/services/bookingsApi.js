import api from "./apiClient";

export const searchHotels = params => api.get("/bookings/search", { params }).then(r => r.data);
export const createBooking = data => api.post("/bookings", data).then(r => r.data);
export const getMyBookings = () => api.get("/bookings/my").then(r => r.data);

export async function downloadBill(bookingId) {
  const res = await api.get(`/bookings/${bookingId}/bill`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `bill-${bookingId}.pdf`;
  link.click();
  window.URL.revokeObjectURL(url);
}
