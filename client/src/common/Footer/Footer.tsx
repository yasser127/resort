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

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <a
              href="#"
              aria-label="Facebook"
              className="text-white/80 hover:text-white transition"
            >
              <Facebook size={16} />
            </a>
            <a
              href="#"
              aria-label="Twitter"
              className="text-white/80 hover:text-white transition"
            >
              <Twitter size={16} />
            </a>
            <a
              href="#"
              aria-label="Dribbble"
              className="text-white/80 hover:text-white transition"
            >
              <Dribbble size={16} />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="text-white/80 hover:text-white transition"
            >
              <Instagram size={16} />
            </a>
          </div>
        </div>

        <div className="md:col-span-6">
          <h4 className="text-sm font-semibold mb-2">Contact</h4>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-white/80">
            <a
              href={`tel:${footerData.phone}`}
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
