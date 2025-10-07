// src/components/Service.tsx
import React, { useEffect, useState } from "react";
import serviceImage from "../../assets/room-service.jpg";

type ServiceRecord = {
  id: number;
  title: string;
  icon?: string | null;
};

const fallbackFeatures = [
  { title: "Fresh food" },
  { title: "Guest services" },
  { title: "Security" },
];

// prefer VITE_API_BASE for consistency; fallback to VITE_API_URL or localhost
const API_BASE = (import.meta.env.VITE_API_BASE as string) ?? (import.meta.env.VITE_API_URL as string) ?? "http://localhost:3000";

function makeString(v: unknown, joiner = " ") {
  if (v === undefined || v === null) return "";
  if (Array.isArray(v)) return v.filter(Boolean).join(joiner);
  return String(v);
}

const Service: React.FC = () => {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // heading pulled from /api/general -> services.title
  const [heading, setHeading] = useState<string>("Our catering service will impress every customer");

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    let mounted = true;

    async function fetchServicesList() {
      try {
        setLoading(true);
        setError(null);

        // fetch services items
        const resp = await fetch(`${API_BASE}/services`, { signal });
        if (!resp.ok) throw new Error(`Failed to fetch services: ${resp.status}`);
        const json = await resp.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: ServiceRecord[] = (json?.data ?? []).map((s: any) => ({
          id: Number(s.id),
          title: String(s.title ?? ""),
          icon: s.icon ?? null,
        }));

        if (mounted) setServices(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("fetchServices error", err);
        if (mounted) setError(err.message ?? "Failed to load services");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // fetch heading from /api/general
    async function fetchHeading() {
      try {
        const r = await fetch(`${API_BASE}/api/general`, { signal });
        if (!r.ok) throw new Error("Failed to fetch generals");
        const g = await r.json();
        const svcTitle = g?.["services.title"];
        // Accept string or array
        const svcTitleStr = makeString(svcTitle, " ");
        if (svcTitleStr && svcTitleStr.trim()) {
          // keep the original phrasing shape by inserting into the existing sentence
          // if the backend string already contains markup/line breaks, use it directly
          setHeading(svcTitleStr);
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        // ignore and keep fallback heading
        console.warn("Could not fetch services.title:", err);
      }
    }

    fetchHeading();
    fetchServicesList();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const useServices = services && services.length > 0;
  const itemsToRender = useServices
    ? services
    : fallbackFeatures.map((f, i) => ({ id: -1 - i, title: f.title, icon: null }));

  return (
    <section
      className="relative bg-cover bg-center"
      style={{ backgroundImage: `url(${serviceImage})` }}
      aria-label="Room service hero"
    >
      <div className="absolute inset-0 bg-black/25" />

      <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 lg:py-36">
        <div className="max-w-3xl">
          <p className="text-sm text-amber-100/90 uppercase tracking-widest mb-4">Room Service</p>

          {/* heading now uses backend-provided services.title */}
          <h1 className="font-serif text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
            {/*
              If the backend returns a multi-line title you can include newline characters.
              We render them as block lines if present.
            */}
            {heading.split("\n").map((line, idx) => (
              <span key={idx} className="block">
                {line}
              </span>
            ))}
          </h1>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="relative w-full max-w-4xl">
            {loading ? (
              <div className="text-center py-12 text-amber-100">Loading services…</div>
            ) : error ? (
              <div className="text-center py-12 text-red-300">Error: {error}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 -mx-2">
                {itemsToRender.map((s) => (
                  <div
                    key={s.id}
                    className="mx-2 bg-amber-50/65 min-w-[100px] w-40 sm:w-52 p-3 shadow-md border border-amber-100/30 rounded-sm text-center"
                  >
                    <div className="flex items-center justify-center mb-4 text-amber-900">
                      {s.icon ? (
                        <img
                          src={s.icon}
                          alt={s.title}
                          className="max-w-full max-h-16 object-contain"
                          onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            el.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-md flex items-center justify-center bg-amber-100 text-amber-700 font-semibold">
                          {s.title?.split(" ").slice(0, 1)[0]?.charAt(0) ?? "S"}
                        </div>
                      )}
                    </div>

                    <h3 className="text-sm font-medium text-amber-900">{s.title}</h3>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Service;
