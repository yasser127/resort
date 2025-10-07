import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const DotFiller = ({ name, price, className = "" }) => {
  const containerRef = useRef(null);
  const nameRef = useRef(null);
  const priceRef = useRef(null);
  const measRef = useRef(null);
  const [dots, setDots] = useState("");

  const update = useCallback(() => {
    const c = containerRef.current;
    const n = nameRef.current;
    const p = priceRef.current;
    const m = measRef.current;
    if (!c || !n || !p || !m) return;
    const gap = 16; // px buffer
    const available = c.clientWidth - n.offsetWidth - p.offsetWidth - gap;
    if (available <= 0) return setDots("");
    const dotWidth = Math.max(1, m.offsetWidth);
    const count = Math.max(0, Math.floor(available / dotWidth));
    setDots(".".repeat(count));
  }, []);

  useLayoutEffect(() => {
    update();
    // ResizeObserver for responsive changes
    const ro = new ResizeObserver(() => update());
    if (containerRef.current) ro.observe(containerRef.current);
    if (nameRef.current) ro.observe(nameRef.current);
    if (priceRef.current) ro.observe(priceRef.current);
    return () => ro.disconnect();
  }, [update]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center w-full ${className}`}
      style={{ gap: 8 }}
    >
      <div ref={nameRef} className="whitespace-nowrap text-base font-semibold">
        {name}
      </div>

      <div
        aria-hidden
        className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis leading-none"
        style={{ letterSpacing: 2 }}
      >
        {dots}
      </div>

      <div
        ref={priceRef}
        className="whitespace-nowrap text-base font-semibold text-rose-800"
      >
        {price}
      </div>

      <span
        ref={measRef}
        className="absolute opacity-0 pointer-events-none"
        style={{ left: -9999, top: -9999 }}
      >
        .
      </span>
    </div>
  );
};

const CardItem = ({ item }) => {
  return (
    <div className="mb-6">
      <DotFiller name={item.name} price={item.price} />
      <div className="text-sm text-gray-400 mt-2">{item.desc}</div>
    </div>
  );
};

const CategorySlide = ({ category, className = "" }) => {
  // two-column layout inside the slide
  const left = category.items.filter((_, i) => i % 2 === 0);
  const right = category.items.filter((_, i) => i % 2 === 1);

  return (
    <div className={`w-full flex-shrink-0 px-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
        <div>
          {left.map((it, idx) => (
            <CardItem key={idx} item={it} />
          ))}
        </div>
        <div>
          {right.map((it, idx) => (
            <CardItem key={idx} item={it} />
          ))}
        </div>
      </div>
    </div>
  );
};

const ItemsMenu = ({ categories = [] }) => {
  const [index, setIndex] = useState(0);
  const containerRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDown = useRef(false);
  const widthRef = useRef(0);

  useEffect(() => {
    widthRef.current = containerRef.current?.clientWidth || 0;
    const onResize = () =>
      (widthRef.current = containerRef.current?.clientWidth || 0);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Pointer / touch handlers to enable swipe
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onPointerDown = (e) => {
      isDown.current = true;
      startX.current = e.clientX || e.touches?.[0]?.clientX || 0;
      el.style.transition = "none";
    };

    const onPointerMove = (e) => {
      if (!isDown.current) return;
      currentX.current =
        (e.clientX || e.touches?.[0]?.clientX || 0) - startX.current;
      // move slides visually
      el.querySelector(".slides").style.transform = `translateX(${
        -index * widthRef.current + currentX.current
      }px)`;
    };

    const onPointerUp = () => {
      if (!isDown.current) return;
      isDown.current = false;
      el.style.transition = "transform 300ms ease";
      const threshold = widthRef.current * 0.2;
      if (Math.abs(currentX.current) > threshold) {
        if (currentX.current > 0 && index > 0) setIndex((i) => i - 1);
        else if (currentX.current < 0 && index < categories.length - 1)
          setIndex((i) => i + 1);
      }
      currentX.current = 0;
    };

    // touch and mouse
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // fallback for touch
    el.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, [index, categories.length]);

  // when index changes, snap slides
  useEffect(() => {
    const slides = containerRef.current?.querySelector(".slides");
    if (!slides) return;
    slides.style.transition = "transform 350ms cubic-bezier(.2,.9,.32,1)";
    slides.style.transform = `translateX(${-index * widthRef.current}px)`;
  }, [index]);

  if (!categories || categories.length === 0)
    return <div className="p-8">No categories provided.</div>;

  return (
    <div
      className="relative max-w-6xl mx-auto py-12 px-6"
      style={{ fontFamily: "Georgia, serif" }}
    >
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-sm text-gray-500 tracking-widest">OUR MENU</div>
        <h2 className="text-4xl md:text-5xl font-serif font-semibold mt-2">
          {categories[index].title}
        </h2>
      </div>

      {/* Outer decorative borders (simplified) */}
      <div className="relative">
        <div
          className="overflow-hidden"
          ref={containerRef}
          style={{ touchAction: "pan-y" }}
        >
          <div className="slides flex w-full">
            {categories.map((cat) => (
              <CategorySlide key={cat.id} category={cat} />
            ))}
          </div>
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center mt-8">
          {categories.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setIndex(i)}
              className={`w-3 h-3 rounded-full mx-2 ${
                i === index ? "bg-rose-800" : "bg-gray-300"
              }`}
              aria-label={`Go to ${c.title}`}
            />
          ))}
        </div>

        {/* Left/Right arrows */}
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/60 p-2 rounded-full shadow"
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          onClick={() =>
            setIndex((i) => Math.min(categories.length - 1, i + 1))
          }
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/60 p-2 rounded-full shadow"
          aria-label="Next"
        >
          ›
        </button>
      </div>

      {/* Small footer spacing */}
    </div>
  );
};

export default ItemsMenu;
