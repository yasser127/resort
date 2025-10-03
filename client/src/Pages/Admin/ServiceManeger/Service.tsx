
import React, { useEffect, useState } from "react";
import axios from "axios";

type Service = {
  id: number;
  title: string;
  icon: string | null; 
};

export default function ServicesAdmin(): JSX.Element {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);


  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

 
  const API = "http://localhost:3000";


  const useRawImageEndpoint = false;

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/services`);
      setServices(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch services", err);
      alert("Failed to fetch services (see console)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    return () => {
      // revoke preview URL on unmount
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setTitle("");
    setFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    setEditingId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);

    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (f) {
      const url = URL.createObjectURL(f);
      setFilePreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please provide a title");
      return;
    }

    const form = new FormData();
    form.append("title", title.trim());
    if (file) form.append("icon", file);

    try {
      if (editingId) {
        // When editing and no file selected, we don't append 'icon' so backend keeps old blob
        await axios.put(`${API}/services/${editingId}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(`${API}/services`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await fetchServices();
      resetForm();
    } catch (err) {
      console.error("Error saving service", err);
      alert("Error saving service (see console)");
    }
  };

  const handleEdit = (s: Service) => {
    setEditingId(s.id);
    setTitle(s.title);
    setFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this service?")) return;
    try {
      await axios.delete(`${API}/services/${id}`);
      await fetchServices();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed (see console)");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="bg-amber-50/95 border border-amber-200 p-6 rounded-md shadow-sm">
        <h2 className="text-xl font-semibold text-amber-900 mb-4">
          {editingId ? "Edit service" : "Add service"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Title</label>
            <input
              className="w-full px-3 py-2 rounded-md border focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fresh food"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Icon (SVG / PNG / JPG)</label>
            <input
              type="file"
              accept="image/*,image/svg+xml"
              onChange={handleFileChange}
            />
            <p className="text-xs text-amber-800 mt-1">
              If editing and you don't choose a file, the existing icon will remain.
            </p>

            {filePreview && (
              <div className="mt-3">
                <div className="text-xs text-amber-900 mb-1">Preview</div>
                <div className="w-32 h-32 bg-white/60 rounded flex items-center justify-center overflow-hidden border">
                  <img src={filePreview} alt="preview" className="max-w-full max-h-full" />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-amber-700 text-white font-semibold shadow-sm"
            >
              {editingId ? "Save changes" : "Add service"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-md bg-white border text-amber-900"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-amber-900">Existing services</h3>
          <div className="text-sm text-amber-700">Total: {services.length}</div>
        </div>

        <div className="mt-4">
          {loading ? (
            <p className="text-amber-900">Loading...</p>
          ) : services.length === 0 ? (
            <p className="text-amber-800">No services yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {services.map((s) => {
                const imgSrc = useRawImageEndpoint
                  ? `${API}/services/${s.id}/image`
                  : s.icon ?? undefined;

                return (
                  <div key={s.id} className="p-4 bg-white rounded shadow-sm border">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-amber-50 rounded flex items-center justify-center overflow-hidden border">
                        {imgSrc ? (
                         
                          <img src={imgSrc} alt={s.title} className="max-w-full max-h-full" />
                        ) : (
                          <div className="text-amber-600 font-semibold">No icon</div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="font-medium text-amber-900">{s.title}</div>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleEdit(s)}
                            className="px-3 py-1 rounded bg-amber-100 text-amber-900 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="px-3 py-1 rounded bg-red-50 text-red-600 text-sm border"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
