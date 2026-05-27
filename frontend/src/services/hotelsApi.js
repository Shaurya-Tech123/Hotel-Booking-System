import api from "./apiClient";

export const getHotelOptions = () => api.get("/hotels/options").then(r => r.data);
export const getHotels = () => api.get("/hotels").then(r => r.data);
export const getHotel = id => api.get(`/hotels/${id}`).then(r => r.data);
export const createHotel = data => api.post("/hotels", data).then(r => r.data);
export const updateHotel = (id, data) => api.put(`/hotels/${id}`, data).then(r => r.data);
export const deleteHotel = id => api.delete(`/hotels/${id}`).then(r => r.data);
export const upsertRoom = (hotelId, data) => api.post(`/hotels/${hotelId}/rooms`, data).then(r => r.data);
export const updateAvailability = (roomId, availability) =>
  api.patch(`/hotels/rooms/${roomId}/availability`, { availability }).then(r => r.data);
export const deleteRoom = roomId => api.delete(`/hotels/rooms/${roomId}`).then(r => r.data);
