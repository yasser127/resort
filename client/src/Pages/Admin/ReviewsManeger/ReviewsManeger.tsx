// src/Pages/Admin/ReviewsManeger/ReviewsManeger.tsx
import React, { useEffect, useState } from "react";
import api from "../../../lib/api";

type Review = {
  id: number;
  name: string;
  description: string;
  photo?: string | null;
};

export default function ReviewsManeger() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Review | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reviews");
      setReviews(res.data.reviews || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setPhotoFile(null);
  };

  const submitCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const form = new FormData();
      form.append("name", name);
      form.append("description", description);
      if (photoFile) form.append("photo", photoFile);

      if (editing) {
        await api.put(`/reviews/${editing.id}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/reviews", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await fetchReviews();
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error saving review");
    }
  };

  const startEdit = (r: Review) => {
    setEditing(r);
    setName(r.name);
    setDescription(r.description);
    setPhotoFile(null);
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this review?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      await fetchReviews();
    } catch (err) {
      console.error(err);
      alert("Error deleting");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Manage Reviews</h2>

      <form onSubmit={submitCreateOrUpdate} className="space-y-3 mb-6">
        <div>
          <label className="block text-sm">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 w-full"
            placeholder="Reviewer name"
            required
          />
        </div>
        <div>
          <label className="block text-sm">Review</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 w-full"
            placeholder="Review text"
            rows={3}
            required
          />
        </div>
        <div>
          <label className="block text-sm">Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files ? e.target.files[0] : null)}
          />
        </div>
        <div className="space-x-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            {editing ? "Save changes" : "Add review"}
          </button>
          <button
            type="button"
            className="px-4 py-2 border rounded"
            onClick={() => resetForm()}
          >
            Reset
          </button>
        </div>
      </form>

      <hr />

      <div className="mt-4">
        {loading ? (
          <div>Loading…</div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="flex items-start gap-4 bg-white p-3 rounded shadow">
                {r.photo ? (
                  <img
                    src={`${api.defaults.baseURL}${r.photo}`}
                    alt={r.name}
                    style={{ width: 100, height: 80, objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: 100, height: 80, background: "#eee" }} />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <strong>{r.name}</strong>
                    <div>
                      <button
                        onClick={() => startEdit(r)}
                        className="mr-2 px-2 py-1 border rounded text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(r.id)}
                        className="px-2 py-1 border rounded text-sm text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{r.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
