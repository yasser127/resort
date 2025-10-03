import React, { useEffect, useState } from "react";
import axios from "axios";

type Room = {
  id: number;
  title: string;
  description?: string | null;
  status?: string | null;
  area?: string | null;
  type?: string | null;
  price?: number | null;
  image?: string | null; 
};

const API_BASE = "http://localhost:3000";

export default function RoomsList(): JSX.Element {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/rooms`);
        const data = res.data?.data ?? [];
        if (mounted) setRooms(data);
      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err.message || "Failed to load rooms");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="p-8 text-center">Loading rooms…</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="px-6 py-12 bg-gray-200">
      <div className="grid max-w-6xl mx-auto  grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {rooms.map((r) => (
          <div key={r.id} className="bg-white  shadow-sm">
            <div className="h-48 bg-gray-100 overflow-hidden">
              {r.image ? (
                <img src={r.image} alt={r.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-lg">{r.title}</h3>
              <p className="text-sm text-gray-600 mt-2">{r.description}</p>

              <div className="mt-4 text-sm text-gray-700">
                <div className="flex justify-between">
                  <div>Area</div>
                  <div>{r.area ?? "-"}</div>
                </div>
                <div className="flex justify-between">
                  <div>Type</div>
                  <div>{r.type ?? "-"}</div>
                </div>
                <div className="flex justify-between">
                  <div>Status</div>
                  <div>{r.status ?? "-"}</div>
                </div>
                <div className="flex justify-between">
                  <div>Price</div>
                  <div>{r.price != null ? `$${r.price}` : "-"}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
