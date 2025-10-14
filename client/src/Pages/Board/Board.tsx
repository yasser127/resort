import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Facebook, Instagram } from "lucide-react";
import restoVideo from "../../assets/Luxury-Resort.mp4";

const headingContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};
const headingItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

type MediaItem = {
  id?: number;
  social_media_name?: string;
  social_media_link?: string;
  name?: string;
  link?: string;
};

const TikTokIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" fill="currentColor" />
  </svg>
);

const Home: React.FC = () => {
  const [title, setTitle] = useState<string>(
    `Stay at one of the\nmost luxurious hotels\nworldwide!`
  );
  const [description, setDescription] = useState<string>(
    "A refined stay combining modern amenities with timeless design. Experience bespoke service and unrivaled comfort."
  );
  const [country, setCountry] = useState<string>("Sierra Leone");
  const [address, setAddress] = useState<string>("Freetown, Sierra Leone");
  const [phone, setPhone] = useState<string>("81-xxx-xxx");
  const [loading, setLoading] = useState<boolean>(true);

  // social links
  const [mediaRows, setMediaRows] = useState<MediaItem[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/general`, { signal });
        if (!res.ok) throw new Error("Failed to fetch generals");
        const data = await res.json();

        const remoteTitle = data?.["home.title"];
        const remoteDesc = data?.["home.description"];
        const remoteCountry = data?.["home.country"];
        const remoteAddress = data?.["home.address"];
        const remotePhone = data?.["home.phone"];

        if (typeof remoteTitle === "string" && remoteTitle.trim().length > 0) {
          setTitle(remoteTitle);
        }
        if (typeof remoteDesc === "string" && remoteDesc.trim().length > 0) {
          setDescription(remoteDesc);
        }
        if (
          typeof remoteCountry === "string" &&
          remoteCountry.trim().length > 0
        ) {
          setCountry(remoteCountry);
        }
        if (
          typeof remoteAddress === "string" &&
          remoteAddress.trim().length > 0
        ) {
          setAddress(remoteAddress);
        }
        if (typeof remotePhone === "string" && remotePhone.trim().length > 0) {
          setPhone(remotePhone);
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.warn("Could not load generals:", err);
      } finally {
        setLoading(false);
      }
    })();

    (async () => {
      try {
        setMediaError(null);
        const r = await fetch(`${API_BASE}/api/general/media`, { signal });
        if (!r.ok) {
          setMediaError(`GET /api/general/media returned ${r.status}`);
          setMediaRows([]);
          console.warn("GET /api/general/media returned", r.status);
          return;
        }
        const rows = await r.json();
        console.debug("raw media rows from API:", rows);

        let normalizedRows: any[] = [];
        if (Array.isArray(rows)) {
          normalizedRows = rows;
        } else if (rows && typeof rows === "object") {
          if (Array.isArray((rows as any).rows))
            normalizedRows = (rows as any).rows;
          else if (Array.isArray((rows as any).data))
            normalizedRows = (rows as any).data;
          else {
            normalizedRows = [rows];
          }
        } else {
          normalizedRows = [];
        }

        const mapped = normalizedRows.map((r: any) => ({
          id: r.id,
          social_media_name: r.social_media_name || r.name || "",
          social_media_link: r.social_media_link || r.link || "",
        }));
        console.debug("normalized media rows:", mapped);
        setMediaRows(mapped);
        if (!mapped.length)
          setMediaError("No media rows returned (empty array)");
      } catch (e: any) {
        if (e.name === "AbortError") return;
        console.warn("Could not load media rows:", e);
        setMediaError(String(e?.message || e));
        setMediaRows([]);
      }
    })();

    return () => controller.abort();
  }, []);

  const titleParts = title.split("\n").filter(Boolean);

  // Helpers
  function normalizeName(n?: string) {
    return (n || "").toLowerCase().trim();
  }
  function normalizeLink(l?: string) {
    return (l || "").trim();
  }
  function ensureHref(raw?: string) {
    if (!raw) return null;
    const s = raw.trim();
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    if (s.startsWith("//")) return "https:" + s;
    return "https://" + s;
  }

  function getFirstLinkFromRow(r: MediaItem) {
    return r.social_media_link || r.link || "";
  }

  // find link by name or by URL pattern
  function findLinkFor(
    platform: "facebook" | "instagram" | "tiktok"
  ): string | null {
    // by name
    const byName = mediaRows.find((m) => {
      const n = normalizeName(m.social_media_name || m.name);
      if (!n) return false;
      return n.includes(platform);
    });
    if (byName) {
      const raw = getFirstLinkFromRow(byName);
      if (raw && normalizeLink(raw)) return ensureHref(raw);
    }

    // by URL - extended checks for tiktok
    const byUrl = mediaRows.find((m) => {
      const l = normalizeLink(getFirstLinkFromRow(m));
      if (!l) return false;
      if (platform === "facebook")
        return l.includes("facebook.com") || l.includes("fb.me");
      if (platform === "instagram")
        return l.includes("instagram.com") || l.includes("instagr.am");
      if (platform === "tiktok")
        return (
          l.includes("tiktok.com") ||
          l.includes("vm.tiktok.com") ||
          l.includes("t.tiktok.com") ||
          l.includes("m.tiktok.com")
        );
      return false;
    });
    if (byUrl) {
      const raw = getFirstLinkFromRow(byUrl);
      if (raw && normalizeLink(raw)) return ensureHref(raw);
    }

    return null;
  }

  const facebookLink = findLinkFor("facebook");
  const instagramLink = findLinkFor("instagram");
  const tiktokLink = findLinkFor("tiktok");

  return (
    <section id="home" className="relative min-h-screen overflow-hidden">
      <video
        src={restoVideo}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,6,6,0.45) 0%, rgba(6,6,6,0.3) 80%)",
          mixBlendMode: "normal",
        }}
      />

      <div
        className="absolute inset-0 bg-[url('/assets/texture.png')] bg-repeat opacity-18 pointer-events-none"
        aria-hidden
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 lg:py-32 flex items-start">
        <div className="w-full lg:w-2/3 pt-25">
          <motion.div
            variants={headingContainer}
            initial="hidden"
            animate="show"
            className="overflow-hidden"
          >
            {titleParts.map((line, idx) => (
              <motion.h1
                key={idx}
                variants={headingItem}
                className="font-serif text-white leading-[0.92] text-[1.1rem] sm:text-[1.5rem] md:text-[2.2rem] lg:text-[3rem] xl:text-[3.8rem] tracking-tight"
              >
                {line}
              </motion.h1>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mt-6 text-sm text-white/80 max-w-xl"
          >
            {loading ? "Loading description…" : description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.05 }}
            className="mt-8 flex items-center gap-4"
          >
            <a
              href={`https://wa.me/96181635574?text=${encodeURIComponent(
                "Hello 👋, I want to book a room — please help me with availability and prices."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-5 py-3 rounded-lg border border-white/25 text-white/90"
            >
              Book a Room
            </a>
          </motion.div>
        </div>
      </div>

      <div className="absolute left-6 bottom-8 z-20 text-xs text-white/80">
        <div className="uppercase font-medium tracking-wider text-[11px]">
          {country}
        </div>
        <div className="mt-1">
          {address} {phone}
        </div>
      </div>

      <div className="absolute right-6 bottom-1/3 z-20 flex flex-col items-center gap-4">
        {facebookLink ? (
          <a
            href={facebookLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-white transition"
            aria-label="Facebook"
            title="Facebook"
          >
            <Facebook size={20} />
          </a>
        ) : (
          <div
            className="text-white/40 opacity-40 cursor-not-allowed"
            title="Facebook — Not configured"
          >
            <Facebook size={20} />
          </div>
        )}

        {instagramLink ? (
          <a
            href={instagramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-white transition"
            aria-label="Instagram"
            title="Instagram"
          >
            <Instagram size={20} />
          </a>
        ) : (
          <div
            className="text-white/40 opacity-40 cursor-not-allowed"
            title="Instagram — Not configured"
          >
            <Instagram size={20} />
          </div>
        )}

        {tiktokLink ? (
          <a
            href={tiktokLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-white transition"
            aria-label="TikTok"
            title="TikTok"
          >
            <TikTokIcon size={20} />
          </a>
        ) : (
          <div
            className="text-white/40 opacity-40 cursor-not-allowed"
            title="TikTok — Not configured"
          >
            <TikTokIcon size={20} />
          </div>
        )}
      </div>
    </section>
  );
};

export default Home;
