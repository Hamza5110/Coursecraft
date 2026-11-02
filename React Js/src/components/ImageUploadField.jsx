import { useState } from "react";
import { mediaUrl, uploadImage } from "../api/blogApi";

function ImageUploadField({
  label = "Cover image",
  value,
  onChange,
  required = false,
  allowUrl = true,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const data = await uploadImage(file);
      onChange(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required ? "" : " (optional)"}
      </label>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={uploading}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-2 text-sm"
      />

      {allowUrl && (
        <>
          <p className="text-xs text-gray-500 mb-1">Or paste an image URL</p>
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://... or /uploads/..."
            className="w-full border p-2 rounded"
            required={required}
          />
        </>
      )}

      {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      {value && (
        <img
          src={mediaUrl(value)}
          alt="Preview"
          className="mt-3 h-32 w-full object-cover rounded-lg bg-gray-100"
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/600x240?text=Image";
          }}
        />
      )}
    </div>
  );
}

export default ImageUploadField;
