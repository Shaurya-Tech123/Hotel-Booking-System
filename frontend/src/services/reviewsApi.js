import api from "./apiClient";

export const addReview = data => api.post("/reviews", data).then(r => r.data);
export const getHotelReviews = hotelId => api.get(`/reviews/hotel/${hotelId}`).then(r => r.data);
