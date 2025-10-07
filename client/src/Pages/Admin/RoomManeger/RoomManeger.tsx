// RoomsManager.tsx
import React, { useEffect, useState } from "react";
import api from "../../../lib/api";

type Room = {
  id: number;
  title: string;
  description?: string | null;
  area?: string | null;
  price?: number | null;
  image?: string | null; // data URI or URL
  type_id?: number | null;
  status_id?: number | null;
  created_at?: string | null;
};

type Option = { id: number; label: string };

export default function RoomsManager(): JSX.Element {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [editing, setEditing] = useState<Room | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // IDs for type/status
  const [statusId, setStatusId] = useState<number | "">("");
  const [typeId, setTypeId] = useState<number | "">("");

  // options (prefer fetching from server; fallback to defaults)
  const [statusOptions, setStatusOptions] = useState<Option[]>([
    // fallback mapping — **adjust to match your DB** if needed
    { id: 1, label: "available" },
    { id: 2, label: "rent" },
    { id: 3, label: "sale" },
  ]);
  const [typeOptions, setTypeOptions] = useState<Option[]>([
    // fallback mapping — adjust to match your DB
    { id: 1, label: "Apartment" },
    { id: 2, label: "House" },
    { id: 3, label: "Studio" },
  ]);

  useEffect(() => {
    fetchInitial();
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchInitial() {
    await Promise.all([fetchRooms(), fetchTypeStatus()]);
  }

  async function fetchTypeStatus() {
    // Try to fetch canonical lists from server (create these endpoints if you don't have them).
    // If they don't exist, keep fallback arrays above.
    try {
      const [sRes, tRes] = await Promise.allSettled([
        api.get("/room-statuses"),
        api.get("/room-types"),
      ]);
      if (sRes.status === "fulfilled" && Array.isArray(sRes.value.data?.data)) {
        setStatusOptions(sRes.value.data.data);
      }
      if (tRes.status === "fulfilled" && Array.isArray(tRes.value.data?.data)) {
        setTypeOptions(tRes.value.data.data);
      }
    } catch (err) {
      // ignore — keep defaults
      console.warn("Could not load type/status lists, using defaults", err);
    }
  }

  async function fetchRooms() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/rooms");
      // server returns type_id and status_id; ensure price numeric
      const data = res.data?.data ?? [];
      setRooms(
        data.map((r: any) => ({
          ...r,
          price: r.price != null ? Number(r.price) : null,
          type_id: r.type_id ?? null,
          status_id: r.status_id ?? null,
        }))
      );
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
    setArea("");
    setPrice("");
    setFile(null);
    setStatusId("");
    setTypeId("");
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
    if (!title.trim()) {
      alert("Title is required");
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("description", description || "");
      form.append("area", area || "");
      form.append("price", price || "");
      // Append IDs expected by the server:
      if (typeId !== "") form.append("type_id", String(typeId));
      if (statusId !== "") form.append("status_id", String(statusId));
      if (file) form.append("image", file);

      if (editing) {
        await api.put(`/rooms/${editing.id}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/rooms", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await fetchRooms();
      resetForm();
    } catch (err: any) {
      console.error("save error", err);
      alert(
        "Save failed: " +
          (err?.response?.data?.message ?? err?.message ?? "unknown")
      );
    } finally {
      setSaving(false);
    }
  }

  function startEdit(r: Room) {
    setEditing(r);
    setTitle(r.title ?? "");
    setDescription(r.description ?? "");
    setArea(r.area ?? "");
    setPrice(r.price != null ? String(r.price) : "");
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    // keep existing r.image as preview (data URI) if present
    if (r.image) setPreview(r.image);

    // set ID values (if present) so selects will reflect current values
    setTypeId(r.type_id ?? "");
    setStatusId(r.status_id ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this room?")) return;
    try {
      await api.delete(`/rooms/${id}`);
      setRooms((prev) => prev.filter((x) => x.id !== id));
    } catch (err: any) {
      console.error("delete error", err);
      alert(
        "Delete failed: " +
          (err?.response?.data?.message ?? err?.message ?? "unknown")
      );
    }
  }

  // helper to show label from options
  const labelFor = (list: Option[], id?: number | null) => {
    if (id == null) return "-";
    const found = list.find((o) => o.id === id);
    return found ? found.label : String(id);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="bg-white p-6 rounded shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {editing ? "Edit room" : "Add room"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="e.g. Ocean view"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={statusId}
              onChange={(e) =>
                setStatusId(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full border rounded p-2"
            >
              <option value="">(select)</option>
              {statusOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Area</label>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="e.g. 70 sq. ft."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={typeId}
              onChange={(e) =>
                setTypeId(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full border rounded p-2"
            >
              <option value="">(select)</option>
              {typeOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="numeric, optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <input type="file" accept="image/*" onChange={onFileChange} />
            {preview && (
              <div className="mt-2">
                <img
                  src={preview}
                  alt="preview"
                  className="w-40 h-28 object-cover border"
                />
                <div className="text-xs text-gray-500 mt-1">Preview</div>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border rounded p-2"
            />
          </div>

          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-amber-700 text-white rounded"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create room"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border rounded"
            >
              Reset
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                }}
                className="px-4 py-2 border rounded text-sm"
              >
                Cancel edit
              </button>
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
                    <img
                      src={r.image}
                      alt={r.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <div className="font-medium">{r.title}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {r.area} • {labelFor(typeOptions, r.type_id)}
                  </div>
                  <div className="text-sm text-gray-700 mt-2">
                    Status: {labelFor(statusOptions, r.status_id)}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => startEdit(r)}
                      className="px-3 py-1 bg-amber-100 text-amber-900 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="px-3 py-1 border text-red-600 rounded"
                    >
                      Delete
                    </button>
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
