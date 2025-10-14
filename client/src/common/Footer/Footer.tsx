import React, { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
} from "lucide-react";

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ?? "http://localhost:3000";

function makeString(v: unknown, joiner = " ") {
  if (v === undefined || v === null) return "";
  if (Array.isArray(v)) return v.filter(Boolean).join(joiner);
  return String(v);
}

type MediaItem = {
  id?: number;
  social_media_name?: string;
  social_media_link?: string;
  name?: string;
  link?: string;
};

const TikTokIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    {/* Minimal musical-note style icon for TikTok */}
    <path
      d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"
      fill="currentColor"
    />
  </svg>
);

const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const [footerData, setFooterData] = useState({
    name: "Luxury Resort",
    phone: "+961 81 0xx xxx",
    email: "hello@luxuryresort.example",
    address: "Freetown, Sierra Leone — Avenue 123",
    invitation_line: "Join our newsletter for exclusive offers and updates.",
  });

  // media rows
  const [mediaRows, setMediaRows] = useState<MediaItem[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/general`, { signal });
        if (!res.ok) throw new Error("Failed to fetch footer data");
        const data = await res.json();

        const updated = {
          name: makeString(data?.["footer.name"]) || footerData.name,
          phone: makeString(data?.["footer.phone"]) || footerData.phone,
          email: makeString(data?.["footer.email"]) || footerData.email,
          address: makeString(data?.["footer.address"]) || footerData.address,
          invitation_line:
            makeString(data?.["footer.invitation_line"]) ||
            footerData.invitation_line,
        };

        setFooterData(updated);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.warn("Could not load footer data:", err);
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
        let normalizedRows: any[] = [];
        if (Array.isArray(rows)) {
          normalizedRows = rows;
        } else if (rows && typeof rows === "object") {
          if (Array.isArray((rows as any).rows)) normalizedRows = (rows as any).rows;
          else if (Array.isArray((rows as any).data)) normalizedRows = (rows as any).data;
          else normalizedRows = [rows];
        } else {
          normalizedRows = [];
        }

        const mapped = normalizedRows.map((r: any) => ({
          id: r.id,
          social_media_name: r.social_media_name || r.name || "",
          social_media_link: r.social_media_link || r.link || "",
        }));
        setMediaRows(mapped);
        if (!mapped.length) setMediaError("No media rows returned (empty array)");
      } catch (e: any) {
        if (e.name === "AbortError") return;
        console.warn("Could not load media rows:", e);
        setMediaError(String(e?.message || e));
        setMediaRows([]);
      }
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  function findLinkFor(platform: "facebook" | "instagram" | "tiktok"): string | null {
    const byName = mediaRows.find((m) => {
      const n = normalizeName(m.social_media_name || m.name);
      if (!n) return false;
      return n.includes(platform);
    });
    if (byName) {
      const raw = getFirstLinkFromRow(byName);
      if (raw && normalizeLink(raw)) return ensureHref(raw);
    }

    const byUrl = mediaRows.find((m) => {
      const l = normalizeLink(getFirstLinkFromRow(m));
      if (!l) return false;
      if (platform === "facebook") return l.includes("facebook.com") || l.includes("fb.me");
      if (platform === "instagram") return l.includes("instagram.com") || l.includes("instagr.am");
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

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      return;
    }

    setStatus("sending");
    setTimeout(() => {
      setStatus("sent");
      setEmail("");
    }, 800);
  };

  return (
    <footer
      className={`transition-colors duration-300 text-white backdrop-blur-md bg-neutral-500`}
    >
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="space-y-3 md:col-span-2">
          <a
            href="/"
            className="flex items-center gap-3"
            aria-label={`${footerData.name} homepage`}
          >
            <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="font-serif text-white text-base">LR</span>
            </div>
            <span className="text-white font-medium tracking-wide text-sm">
              {footerData.name}
            </span>
          </a>

          <div className="flex items-center gap-3 -mt-1">
            {facebookLink ? (
              <a
                href={facebookLink}
                aria-label="Facebook"
                title="Facebook"
                className="text-white/80 hover:text-white transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FacebookIcon size={16} />
              </a>
            ) : null}

            {instagramLink ? (
              <a
                href={instagramLink}
                aria-label="Instagram"
                title="Instagram"
                className="text-white/80 hover:text-white transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramIcon size={16} />
              </a>
            ) : null}

            {tiktokLink ? (
              <a
                href={tiktokLink}
                aria-label="TikTok"
                title="TikTok"
                className="text-white/80 hover:text-white transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                <TikTokIcon size={16} />
              </a>
            ) : null}
          </div>
        </div>

        <div className="md:col-span-6">
          <h4 className="text-sm font-semibold mb-2">Contact</h4>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-white/80">
            <a
              href={`https://wa.me/96181635574?text=${encodeURIComponent(
                "Hello 👋, I want to book a room — please help me with availability and prices."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 min-w-0"
            >
              <Phone size={14} className="flex-shrink-0" />
              <span className="break-words leading-5">{footerData.phone}</span>
            </a>

            <a
              href={`mailto:${footerData.email}`}
              className="flex items-center gap-2 min-w-0"
            >
              <Mail size={14} className="flex-shrink-0" />
              <span className="break-words leading-5">{footerData.email}</span>
            </a>

            <div className="flex items-center gap-2 min-w-0">
              <MapPin size={14} className="flex-shrink-0" />
              <span className="break-words leading-5">
                {footerData.address}
              </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-4">
          <h4 className="text-sm font-semibold mb-2">Stay in the loop</h4>
          <p className="text-sm text-white/80 mb-2">
            {footerData.invitation_line}
          </p>

          <form
            onSubmit={handleJoin}
            className="flex flex-col sm:flex-row gap-2"
          >
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/10"
              aria-label="Email address"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="px-3 py-1.5 rounded-lg bg-white text-black font-medium text-sm shadow-sm hover:scale-[1.01] transition-transform disabled:opacity-60"
            >
              {status === "sending"
                ? "Sending..."
                : status === "sent"
                ? "Joined"
                : "Join"}
            </button>
          </form>

          {status === "error" && (
            <div className="mt-2 text-xs text-rose-400">
              Please enter a valid email address.
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
