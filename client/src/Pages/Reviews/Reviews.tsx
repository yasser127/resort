import React, { useEffect, useState, useRef, KeyboardEvent } from "react";
import api from "../../lib/api";

type Review = {
  id: number;
  name: string;
  description: string;
  photo?: string | null;
};

export default function ReviewsList() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get("/reviews")
      .then((res) => {
        if (!mounted) return;
        setReviews(res.data.reviews || []);
        setIndex(0);
      })
      .catch((err) => {
        console.error("Failed to load reviews:", err);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const prev = () => {
    setIndex((i) => (reviews.length ? (i - 1 + reviews.length) % reviews.length : 0));
  };
  const next = () => {
    setIndex((i) => (reviews.length ? (i + 1) % reviews.length : 0));
  };
  const goTo = (i: number) => setIndex(i);

  // keyboard navigation when focused
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  if (loading) return <div className="py-12 text-center">Loading reviews…</div>;
  if (!reviews.length) return <div className="py-12 text-center">No reviews yet.</div>;

  const current = reviews[index];
  const base = api.defaults.baseURL || "";

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="relative select-none bg-[color:var(--cream,#fbf7f2)] py-16 px-6 md:px-12"
      aria-roledescription="carousel"
      aria-label="Customer reviews"
      style={{ backgroundImage: "url('/')" }} // optional background image; replace if you want
    >
      {/* Left arrow */}
      <button
        onClick={prev}
        aria-label="Previous review"
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 shadow hover:bg-white focus:outline-none"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Right arrow */}
      <button
        onClick={next}
        aria-label="Next review"
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 shadow hover:bg-white focus:outline-none"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <div className="max-w-4xl mx-auto text-center">
        {/* Quote */}
        <blockquote className="text-center mx-auto max-w-3xl">
          <p className="text-lg md:text-2xl lg:text-3xl leading-relaxed md:leading-snug font-serif italic text-gray-800">
            “{current.description}”
          </p>
        </blockquote>

        {/* Name + role */}
        <div className="mt-6">
          <div className="text-base md:text-lg font-semibold text-gray-800">{current.name}</div>
          <div className="text-sm text-gray-500">Client</div>
        </div>

        {/* avatars */}
        <div className="mt-8 flex items-center justify-center gap-3">
          {reviews.map((r, i) => {
            const src = r.photo ? `${base}${r.photo}` : null;
            const isActive = i === index;
            return (
              <button
                key={r.id}
                onClick={() => goTo(i)}
                aria-label={`Go to review by ${r.name}`}
                className={`w-14 h-14 rounded-full overflow-hidden ring-2 transition-all transform ${
                  isActive ? "ring-amber-400 scale-105" : "ring-transparent"
                }`}
                style={{ boxShadow: isActive ? "0 6px 18px rgba(0,0,0,0.12)" : undefined }}
              >
                {src ? (
                  <img src={src} alt={r.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-600">
                    {r.name?.split(" ").map((s) => s[0]).slice(0,2).join("")}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        /* optional: make container focus outline nicer */
        div[tabindex="0"]:focus {
          outline: none;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.12);
          border-radius: 0.25rem;
        }
      `}</style>
    </div>
  );
}
