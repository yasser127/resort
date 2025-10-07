import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram, Dribbble } from "lucide-react";
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

const Home: React.FC = () => {
  const [title, setTitle] = useState<string>(
    // default multiline title (keeps same split lines as before)
    `Stay at one of the\nmost luxurious hotels\nworldwide!`
  );
  const [description, setDescription] = useState<string>(
    "A refined stay combining modern amenities with timeless design. Experience bespoke service and unrivaled comfort."
  );
  const [country, setCountry] = useState<string>("Sierra Leone");
  const [address, setAddress] = useState<string>("Freetown, Sierra Leone");
  const [phone, setPhone] = useState<string>("81-xxx-xxx");
  const [loading, setLoading] = useState<boolean>(true);


  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/general`, { signal });
        if (!res.ok) throw new Error("Failed to fetch generals");
        const data = await res.json();

        // data may have parsed types (strings or arrays). We expect strings for these keys.
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
        if (typeof remoteCountry === "string" && remoteCountry.trim().length > 0) {
          setCountry(remoteCountry);
        }
        if (typeof remoteAddress === "string" && remoteAddress.trim().length > 0) {
          setAddress(remoteAddress);
        }
        if (typeof remotePhone === "string" && remotePhone.trim().length > 0) {
          setPhone(remotePhone);
        }
      } catch (err: any) {
        if (err.name === "AbortError") return; // ignore abort
        // otherwise keep defaults and optionally log
        console.warn("Could not load generals:", err);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  // split title by newline so each line becomes an <h1> (preserves your original multi-h1 design)
  const titleParts = title.split("\n").filter(Boolean);

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
            {/* Render each title line as its own animated heading */}
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
            {/* show loading text while fetching optional */}
            {loading ? "Loading description…" : description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.05 }}
            className="mt-8 flex items-center gap-4"
          >
            <a
              href="#book"
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
        <div className="mt-1">{address} {phone}</div>
      </div>

      <div className="absolute right-6 bottom-1/3 z-20 hidden sm:flex flex-col items-center gap-4">
        <a href="#" className="text-white/80 hover:text-white transition">
          <Facebook size={16} />
        </a>
        <a href="#" className="text-white/80 hover:text-white transition">
          <Twitter size={16} />
        </a>
        <a href="#" className="text-white/80 hover:text-white transition">
          <Dribbble size={16} />
        </a>
        <a href="#" className="text-white/80 hover:text-white transition">
          <Instagram size={16} />
        </a>
      </div>
    </section>
  );
};

export default Home;
