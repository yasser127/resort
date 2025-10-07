// src/components/Footer.tsx
import React, { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Dribbble,
} from "lucide-react";

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ?? "http://localhost:3000";

function makeString(v: unknown, joiner = " ") {
  if (v === undefined || v === null) return "";
  if (Array.isArray(v)) return v.filter(Boolean).join(joiner);
  return String(v);
}

const Footer: React.FC = () => {
  // Local subscription state
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  // Dynamic backend data
  const [footerData, setFooterData] = useState({
    name: "Luxury Resort",
    description:
      "A refined stay combining modern amenities with timeless design. Visit us in Beirut for an unforgettable experience.",
    phone: "+961 81 0xx xxx",
    email: "hello@luxuryresort.example",
    address: "Freetown, Sierra Leone — Avenue 123",
    invitation_line: "Join our newsletter for exclusive offers and updates.",
  });

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
          description:
            makeString(data?.["footer.description"]) || footerData.description,
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

    return () => controller.abort();
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      return;
    }

    setStatus("sending");
    // Placeholder: replace with real API call
    setTimeout(() => {
      setStatus("sent");
      setEmail("");
    }, 800);
  };

  return (
    <footer className="bg-amber-900 backdrop-blur-md text-white">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand / Info */}
        <div className="space-y-4">
          <a
            href="/"
            className="flex items-center gap-3"
            aria-label={`${footerData.name} homepage`}
          >
            <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="font-serif text-white text-lg">LR</span>
            </div>
            <span className="text-white font-medium tracking-wide">
              {footerData.name}
            </span>
          </a>

          <p className="text-sm text-white/80 max-w-xs">
            {footerData.description}
          </p>

          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="Facebook"
              className="text-white/80 hover:text-white transition"
            >
              <Facebook size={18} />
            </a>
            <a
              href="#"
              aria-label="Twitter"
              className="text-white/80 hover:text-white transition"
            >
              <Twitter size={18} />
            </a>
            <a
              href="#"
              aria-label="Dribbble"
              className="text-white/80 hover:text-white transition"
            >
              <Dribbble size={18} />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="text-white/80 hover:text-white transition"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Contact</h4>
          <div className="flex flex-col gap-3 text-sm text-white/80">
            <a
              href={`tel:${footerData.phone}`}
              className="flex items-center gap-2 hover:text-white transition"
            >
              <Phone size={16} /> <span>{footerData.phone}</span>
            </a>
            <a
              href={`mailto:${footerData.email}`}
              className="flex items-center gap-2 hover:text-white transition"
            >
              <Mail size={16} /> <span>{footerData.email}</span>
            </a>
            <div className="flex items-start gap-2">
              <MapPin size={16} />
              <div className="text-white/80">{footerData.address}</div>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="md:col-span-2">
          <h4 className="text-sm font-semibold mb-3 ">Stay in the loop</h4>
          <p className="text-sm text-white/80 mb-3">
            {footerData.invitation_line}
          </p>

          <form
            onSubmit={handleJoin}
            className="flex flex-col sm:flex-row gap-3"
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
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/10"
              aria-label="Email address"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="px-4 py-2 rounded-lg bg-white text-black font-medium text-sm shadow-sm hover:scale-[1.01] transition-transform disabled:opacity-60"
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
