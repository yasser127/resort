import  { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

type GeneralData = {
  "gymPool.title"?: string;
  "gymPool.pool_description"?: string;
  "gymPool.gym_description"?: string;
};

export default function GymPool() {
  const [data, setData] = useState<GeneralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const poolImageUrl = `${API_BASE}/api/general/image/gymPool.pool_image`;
  const gymImageUrl = `${API_BASE}/api/general/image/gymPool.gym_image`;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`${API_BASE}/api/general`);
        if (!res.ok) throw new Error("Failed to load content");
        const json = await res.json();
        if (!mounted) return;
        setData({
          "gymPool.title": json["gymPool.title"] || json["gymPool.title".toString()],
          "gymPool.pool_description": json["gymPool.pool_description"],
          "gymPool.gym_description": json["gymPool.gym_description"],
        });
      } catch (e: any) {
        console.error(e);
        if (!mounted) return;
        setErr("Failed to load content");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const title =
    data?.["gymPool.title"] ||
    "Our hotel offers its bar and restaurant for your special events";
  const poolDesc =
    data?.["gymPool.pool_description"] ||
    "Relax in our heated outdoor pool with lounge areas and poolside service.";
  const gymDesc =
    data?.["gymPool.gym_description"] ||
    "State-of-the-art gym open 24/7 with cardio, weights, and personal trainers.";

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center px-4 bg-white">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 text-indigo-600">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
            <span className="text-sm">Loading…</span>
          </div>
        </div>
      </section>
    );
  }

  if (err) {
    return (
      <section className="min-h-screen flex items-center justify-center px-4 bg-white">
        <div className="text-center text-rose-600">{err}</div>
      </section>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="w-full max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
 
          <div className="order-1 lg:order-1 flex flex-col justify-start">
            <p className="text-xs uppercase tracking-widest text-gray-400">Bar & Restaurant</p>

            <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-serif font-bold leading-tight text-slate-900">
              {title}
            </h2>

            <p className="mt-4 text-sm text-gray-500 max-w-md">
              Experience our modern fitness center and relaxing pool — perfect for both training and leisure.
            </p>

            <div className="mt-8 lg:mt-12 max-w-md">
              <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white">
                <img
                  src={poolImageUrl}
                  alt="Pool area"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='100%25' height='100%25' fill='%23e6eef8'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='18' fill='%2391a7d1'%3EPool image unavailable%3C/text%3E%3C/svg%3E";
                  }}
                  className="w-full h-[160px] sm:h-[440px] md:h-[520px] lg:h-[560px] object-cover"
                  loading="lazy"
                  style={{ objectPosition: "center" }}
                />
              </div>

        
              <div className="mt-4 bg-white/60 border border-gray-100 rounded-2xl p-4 shadow-sm max-w-md">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">What to expect — Pool</h4>
                <p className="mt-2 text-sm text-gray-600">{poolDesc}</p>
              </div>
            </div>
          </div>

     
          <div className="order-2 lg:order-2 flex flex-col items-start lg:items-end">
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white w-full max-w-[360px] sm:max-w-[420px]">
              <img
                src={gymImageUrl}
                alt="Gym"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='1200'%3E%3Crect width='100%25' height='100%25' fill='%23eef6ea'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='18' fill='%2382b07f'%3EGym image unavailable%3C/text%3E%3C/svg%3E";
                }}
                className="w-full h-[160px] sm:h-[440px] md:h-[520px] lg:h-[560px] object-cover"
                loading="lazy"
                style={{ objectPosition: "top" }}
              />
            </div>

        
            <div className="mt-4 bg-white/60 border border-gray-100 rounded-2xl p-4 shadow-sm w-full max-w-[360px] sm:max-w-[420px]">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">What to expect — Gym</h4>
              <p className="mt-2 text-sm text-gray-600">{gymDesc}</p>
            </div>
          </div>
        </div>

    
      </div>
    </section>
  );
}
