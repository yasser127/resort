import  { useEffect, useState } from "react";
import axios from "axios";
import type { JSX } from "react/jsx-runtime";

type Room = {
  id: number;
  title: string;
  description?: string | null;
  status?: string | null;
  area?: string | null;
  type?: string | null;
  price?: number | null;
  image?: string | null;
  type_id?: number | null;
  status_id?: number | null;
};

const API_BASE = "http://localhost:3000";

export default function RoomsList(): JSX.Element {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const [typesMap, setTypesMap] = useState<Record<number, string>>({});
  const [statusesMap, setStatusesMap] = useState<Record<number, string>>({});

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        // fetch rooms and the optional type/status lists in parallel
        const [roomsRes, typesRes, statusesRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/rooms`),
          axios.get(`${API_BASE}/room-types`),
          axios.get(`${API_BASE}/room-statuses`),
        ]);

        if (roomsRes.status === "fulfilled") {
          const data = roomsRes.value.data?.data ?? [];
          if (mounted) setRooms(data);
        } else {
          // rooms failed — show error
          throw roomsRes.reason ?? new Error("Failed to load rooms");
        }

        // build types map if endpoint returned something usable
        if (typesRes.status === "fulfilled") {
          const arr = typesRes.value.data?.data;
          if (Array.isArray(arr)) {
            const m: Record<number, string> = {};
            for (const item of arr) {
              // accept {id, name} or {id, label}
              if (item && typeof item.id === "number") {
                m[item.id] = item.label ?? item.name ?? String(item.id);
              }
            }
            if (mounted) setTypesMap(m);
          }
        }

        // build statuses map if endpoint returned something usable
        if (statusesRes.status === "fulfilled") {
          const arr = statusesRes.value.data?.data;
          if (Array.isArray(arr)) {
            const m: Record<number, string> = {};
            for (const item of arr) {
              if (item && typeof item.id === "number") {
                m[item.id] = item.label ?? item.name ?? String(item.id);
              }
            }
            if (mounted) setStatusesMap(m);
          }
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("load error", err);
        if (mounted) setError(err.message || "Failed to load rooms");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // helper to get a readable label for a room's type
  function getTypeLabel(r: Room) {
    if (r.type && typeof r.type === "string" && r.type.trim() !== "")
      return r.type;
    if (r.type_id != null) {
      const lbl = typesMap[r.type_id];
      if (lbl) return lbl;
      return `#${r.type_id}`; // fallback if we only have the id
    }
    return "-";
  }

  // helper to get a readable label for a room's status
  function getStatusLabel(r: Room) {
    if (r.status && typeof r.status === "string" && r.status.trim() !== "")
      return r.status;
    if (r.status_id != null) {
      const lbl = statusesMap[r.status_id];
      if (lbl) return lbl;
      return `#${r.status_id}`;
    }
    return "-";
  }

  if (loading) return <div className="p-8 text-center">Loading rooms…</div>;
  if (error)
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="px-6 py-12 bg-gray-200">
      <div className="grid max-w-6xl mx-auto  grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {rooms.map((r) => (
          <div key={r.id} className="bg-white  shadow-sm">
            <div className="h-48 bg-gray-100 overflow-hidden">
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
                  <div>{getTypeLabel(r)}</div>
                </div>
                <div className="flex justify-between">
                  <div>Status</div>
                  <div>{getStatusLabel(r)}</div>
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
