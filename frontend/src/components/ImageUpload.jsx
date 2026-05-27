import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { uploadHotelImages, uploadRoomImages } from "../services/uploadsApi";
import { getImageUrl } from "../utils/imageUrl";

const ACCEPT = "image/jpeg,image/jpg,image/png";
const MAX_SIZE_MB = 5;

/**
 * Multi-image upload with local preview and backend upload via multer.
 */
export default function ImageUpload({ type = "room", value = [], onChange, label = "Upload images" }) {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const invalid = files.find(f => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (invalid) {
      toast.error(`Each image must be under ${MAX_SIZE_MB}MB`);
      return;
    }

    const newPreviews = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const uploadFiles = async () => {
    if (!previews.length) return toast.info("Select images to upload first");
    setUploading(true);
    try {
      const formData = new FormData();
      previews.forEach(p => formData.append("images", p.file));
      const uploadFn = type === "hotel" ? uploadHotelImages : uploadRoomImages;
      const data = await uploadFn(formData);
      const merged = [...value, ...(data.urls || [])];
      onChange(merged);
      previews.forEach(p => URL.revokeObjectURL(p.url));
      setPreviews([]);
      toast.success("Images uploaded");
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeUploaded = url => onChange(value.filter(u => u !== url));
  const removePreview = index => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="image-upload">
      <label className="image-upload__label">{label}</label>
      <p className="muted">JPG, JPEG, PNG · max {MAX_SIZE_MB}MB each</p>

      <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden onChange={handleFileSelect} />

      <div className="image-upload__actions">
        <button type="button" className="btn-secondary" onClick={() => inputRef.current?.click()}>
          Choose Files
        </button>
        {previews.length > 0 ? (
          <button type="button" className="btn-primary" onClick={uploadFiles} disabled={uploading}>
            {uploading ? "Uploading..." : `Upload ${previews.length} image(s)`}
          </button>
        ) : null}
      </div>

      <div className="image-preview-grid">
        {previews.map((p, i) => (
          <div key={`preview-${i}`} className="image-preview-item">
            <img src={p.url} alt={p.name} />
            <button type="button" className="image-remove" onClick={() => removePreview(i)}>
              ×
            </button>
            <span className="image-badge">Preview</span>
          </div>
        ))}
        {value.map(url => (
          <div key={url} className="image-preview-item">
            <img src={getImageUrl(url)} alt="Uploaded" />
            <button type="button" className="image-remove" onClick={() => removeUploaded(url)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
