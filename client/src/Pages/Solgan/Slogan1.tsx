import React, { useEffect, useRef, useState } from "react";
import luxuryDecorTop from "../../assets/luxury-decor-top.webp";

type Props = {
  slogans?: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseAfterFull?: number;
  pauseBeforeTyping?: number;
  loop?: boolean;
  className?: string;
};

const DEFAULT_SLOGANS = [
  "Luxury resorts, private tours and VIP transfers, carefully hand-picked based on your tastes and build",
  "A refined stay combining modern amenities with timeless design",
  "Experience bespoke service and unrivaled comfort",
];

const SloganTyper2: React.FC<Props> = ({
  slogans = DEFAULT_SLOGANS,
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseAfterFull = 1400,
  pauseBeforeTyping = 400,
  loop = true,
  className = "",
}) => {
  const [index, setIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;

    const current = slogans[index % slogans.length];

    if (isDeleting) {
      if (charCount > 0) {
        const t = setTimeout(() => {
          if (!mountedRef.current) return;
          setCharCount((c) => c - 1);
        }, deletingSpeed);
        return () => clearTimeout(t);
      } else {
        const nextIndex = (index + 1) % slogans.length;
        const t = setTimeout(() => {
          if (!mountedRef.current) return;
          setIndex(nextIndex);
          setIsDeleting(false);
        }, pauseBeforeTyping);
        return () => clearTimeout(t);
      }
    }

    if (charCount < current.length) {
      const t = setTimeout(() => {
        if (!mountedRef.current) return;
        setCharCount((c) => c + 1);
      }, typingSpeed);
      return () => clearTimeout(t);
    }

    if (charCount === current.length) {
      if (!loop && index === slogans.length - 1) return;
      const t = setTimeout(() => {
        if (!mountedRef.current) return;
        setIsDeleting(true);
      }, pauseAfterFull);
      return () => clearTimeout(t);
    }
  }, [
    charCount,
    isDeleting,
    index,
    slogans,
    typingSpeed,
    deletingSpeed,
    pauseAfterFull,
    pauseBeforeTyping,
    loop,
  ]);

  const currentText = slogans[index % slogans.length].slice(0, charCount);

  return (
    <>
      <div className="flex justify-center items-center w-full h-full bg-gray-200 pt-20">
        <img
          src={luxuryDecorTop}
          alt="Luxury Decor"
          className="w-100 h-25 object-cover"
        />
      </div>

      <div
        aria-live="polite"
        className={`w-full h-[30vh] flex justify-center items-start px-6 py-8 bg-gray-200 ${className}`}
      >
        <div className="max-w-4xl text-center">
          <div className="text-[9px] uppercase tracking-wider text-gray-700 mb-4">
            What we offer
          </div>

          <h2
            className="font-serif text-gray-900 leading-tight
        text-[0.3rem] sm:text-[1.1rem] md:text-[1.8rem] lg:text-[2.6rem] xl:text-[2.2rem]
        mx-auto max-w-4xl"
            style={{ lineHeight: 1.05 }}
          >
            <span>{currentText}</span>
            <span
              aria-hidden
              className="inline-block ml-1 align-middle w-[2px] h-[1.08em] bg-gray-900 animate-pulse"
              style={{ verticalAlign: "text-bottom" }}
            />
          </h2>

          <div className="mt-4 text-sm text-gray-700">
            Peter Bowman — Creative Director
          </div>
        </div>
      </div>
    </>
  );
};

export default SloganTyper2;
