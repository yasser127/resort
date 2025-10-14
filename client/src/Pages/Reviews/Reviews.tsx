import { useEffect, useState, useRef, useCallback } from "react";
import type { KeyboardEvent } from "react";
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
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

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

  const prev = useCallback(() => {
    setIndex((i) =>
      reviews.length ? (i - 1 + reviews.length) % reviews.length : 0
    );
  }, [reviews.length]);
  const next = useCallback(() => {
    setIndex((i) => (reviews.length ? (i + 1) % reviews.length : 0));
  }, [reviews.length]);
  const goTo = (i: number) => setIndex(i);

  // keyboard navigation when focused
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  // touch (swipe) handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches?.[0]?.clientX ?? null;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const x = e.touches?.[0]?.clientX ?? 0;
    touchDeltaX.current = x - touchStartX.current;
  };
  const onTouchEnd = () => {
    const dx = touchDeltaX.current;
    const threshold = 50; // px to trigger swipe
    if (dx > threshold) prev();
    else if (dx < -threshold) next();
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  if (loading) return <div className="py-12 text-center">Loading reviews…</div>;
  if (!reviews.length)
    return <div className="py-12 text-center">No reviews yet.</div>;

  const base = api.defaults.baseURL || "";

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative select-none bg-[color:var(--cream,#fbf7f2)] py-16 px-4 md:px-8"
      aria-roledescription="carousel"
      aria-label="Customer reviews"
    >
      <div className="max-w-4xl mx-auto text-center relative ">
        {/* Arrows placed inside the centered container so they're closer to the review text */}
        <button
          onClick={prev}
          aria-label="Previous review"
          className="absolute  left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-neutral-400 shadow hover:bg-neutral-500 transition-colors duration-300 ease-in-out focus:outline-none"
          title="Previous"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 18l-6-6 6-6"
            />
          </svg>
        </button>

        <button
          onClick={next}
          aria-label="Next review"
          className="absolute right-2  top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-neutral-400 shadow hover:bg-neutral-500 transition-colors duration-300 ease-in-out   focus:outline-none"
          title="Next"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 6l6 6-6 6"
            />
          </svg>
        </button>

        {/* Carousel track */}
        <div className="overflow-hidden mt-2">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
            aria-live="polite"
          >
            {reviews.map((r) => (
              <article key={r.id} className="min-w-full px-6 md:px-12 py-12">
                <blockquote className="text-center mx-auto max-w-3xl">
                  <p className="text-lg md:text-2xl lg:text-3xl leading-relaxed md:leading-snug font-serif italic text-gray-800">
                    “{r.description}”
                  </p>
                </blockquote>

                <div className="mt-6">
                  <div className="text-base md:text-lg font-semibold text-gray-800">
                    {r.name}
                  </div>
                  <div className="text-sm text-gray-500">Client</div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* avatars / indicators */}
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
                style={{
                  boxShadow: isActive
                    ? "0 6px 18px rgba(0,0,0,0.12)"
                    : undefined,
                }}
              >
                {src ? (
                  <img
                    src={src}
                    alt={r.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-600">
                    {r.name
                      ?.split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
