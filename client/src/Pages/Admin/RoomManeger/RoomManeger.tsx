import React, { useEffect, useState } from "react";
import api from "../../../lib/api";

type Room = {
  id: number;
  title: string;
  description?: string | null;
  status?: string | null;
  area?: string | null;
  type?: string | null;
  price?: number | null;
  image?: string | null; // data URI or URL
};

export default function RoomsManeger(): JSX.Element {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [editing, setEditing] = useState<Room | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("available");
  const [area, setArea] = useState("");
  const [typeField, setTypeField] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRooms();
    // revoke preview when unmount
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchRooms() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/rooms");
      setRooms(res.data?.data ?? []);
    } catch (err: any) {
      console.error("fetchRooms error", err);
      setError(err?.message ?? "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setStatus("available");
    setArea("");
    setTypeField("");
    setPrice("");
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    if (f) {
      setPreview(URL.createObjectURL(f));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { alert("Title is required"); return; }
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("description", description);
      form.append("status", status);
      form.append("area", area);
      form.append("type", typeField);
      form.append("price", price);
      if (file) form.append("image", file);

      if (editing) {
        await api.put(`/rooms/${editing.id}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        // success
      } else {
        await api.post("/rooms", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await fetchRooms();
      resetForm();
    } catch (err: any) {
      console.error("save error", err);
      alert("Save failed: " + (err?.response?.data?.message ?? err?.message ?? "unknown"));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(r: Room) {
    setEditing(r);
    setTitle(r.title ?? "");
    setDescription(r.description ?? "");
    setStatus(r.status ?? "available");
    setArea(r.area ?? "");
    setTypeField(r.type ?? "");
    setPrice(r.price != null ? String(r.price) : "");
    setFile(null);
    if (preview) { URL.revokeObjectURL(preview); setPreview(null); }
    // keep existing r.image as preview (data URI) if present
    if (r.image) setPreview(r.image);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this room?")) return;
    try {
      await api.delete(`/rooms/${id}`);
      setRooms((prev) => prev.filter((x) => x.id !== id));
    } catch (err: any) {
      console.error("delete error", err);
      alert("Delete failed: " + (err?.response?.data?.message ?? err?.message ?? "unknown"));
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="bg-white p-6 rounded shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4">{editing ? "Edit room" : "Add room"}</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded p-2" placeholder="e.g. Ocean view" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded p-2">
              <option value="available">Available</option>
              <option value="rent">Rent</option>
              <option value="sale">Sale</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Area</label>
            <input value={area} onChange={(e) => setArea(e.target.value)} className="w-full border rounded p-2" placeholder="e.g. 70 sq. ft." />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <input value={typeField} onChange={(e) => setTypeField(e.target.value)} className="w-full border rounded p-2" placeholder="e.g. Apartment" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border rounded p-2" placeholder="numeric, optional" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <input type="file" accept="image/*" onChange={onFileChange} />
            {preview && (
              <div className="mt-2">
                <img src={preview} alt="preview" className="w-40 h-28 object-cover border" />
                <div className="text-xs text-gray-500 mt-1">Preview</div>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full border rounded p-2" />
          </div>

          <div className="md:col-span-2 flex gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-amber-700 text-white rounded">
              {saving ? "Saving..." : editing ? "Save changes" : "Create room"}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border rounded">Reset</button>
            {editing && (
              <button type="button" onClick={() => {
                // cancel edit
                resetForm();
              }} className="px-4 py-2 border rounded text-sm">Cancel edit</button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Existing rooms</h3>
        {loading ? (
          <div>Loading rooms…</div>
        ) : error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : rooms.length === 0 ? (
          <div className="text-gray-600">No rooms yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rooms.map((r) => (
              <div key={r.id} className="border bg-white">
                <div className="h-40 bg-gray-100 overflow-hidden">
                  {r.image ? (
                    <img src={r.image} alt={r.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                  )}
                </div>

                <div className="p-3">
                  <div className="font-medium">{r.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{r.area} • {r.type}</div>
                  <div className="text-sm text-gray-700 mt-2">Status: {r.status ?? "-"}</div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => startEdit(r)} className="px-3 py-1 bg-amber-100 text-amber-900 rounded">Edit</button>
                    <button onClick={() => handleDelete(r.id)} className="px-3 py-1 border text-red-600 rounded">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
