import api from "./apiClient";

export function uploadHotelImages(formData) {
  return api
    .post("/admin/uploads/hotel", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    .then(r => r.data);
}

export function uploadRoomImages(formData) {
  return api
    .post("/admin/uploads/room", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    .then(r => r.data);
}
