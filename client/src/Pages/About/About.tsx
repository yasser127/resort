import React, { useEffect, useState } from "react";
import resortImg from "../../assets/My-Nature-Resort.webp";
import { motion, useMotionValue, animate, useInView } from "framer-motion";

//function makeString(v: unknown, joiner = " ") {
//  if (v === undefined || v === null) return "";
//  if (Array.isArray(v)) return v.filter(Boolean).join(joiner);
//  return String(v);
//}

function makeArray(v: unknown) {
  if (v === undefined || v === null) return [] as string[];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      // not JSON — fall back to a single-item array
    }
    return [trimmed];
  }
  return [String(v)];
}

function toNumberSafe(v: unknown, fallback = 0) {
  if (v === undefined || v === null) return fallback;
  if (typeof v === "number") return Math.round(v);
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function AnimatedNumber({
  from = 0,
  to = 0,
  duration = 1.6,
  suffix = "",
  start = true,
}: {
  from?: number;
  to?: number;
  duration?: number;
  suffix?: string;
  start?: boolean;
}) {
  const motionValue = useMotionValue(from);
  const [value, setValue] = React.useState(from);

  React.useEffect(() => {
    if (!start) return;

    const controls = animate(motionValue, to, {
      duration,
      onUpdate(v) {
        setValue(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [start, to, duration, motionValue]);

  return (
    <span>
      {value}
      {suffix}
    </span>
  );
}

function Stat({
  title,
  value,
  suffix,
  delay = 0,
}: {
  title: string;
  value: number;
  suffix?: string;
  delay?: number;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ delay, duration: 0.6 }}
      className="flex flex-col"
    >
      <div className="text-3xl md:text-4xl font-extrabold text-gray-900">
        <AnimatedNumber
          to={value}
          duration={2}
          suffix={suffix}
          start={inView}
        />
      </div>
      <div className="text-sm text-gray-600">{title}</div>
    </motion.div>
  );
}

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ?? "http://localhost:3000";

export default function AboutPage() {
  const [title, setTitle] = useState<string>("About Luxury Resort");
  const [description, setDescription] = useState<string>(
    "A refined stay combining modern amenities with timeless design. We craft bespoke experiences and unparalleled comfort tailored to each guest."
  );
  const [story, setStory] = useState<string>(
    `Founded with a passion for hospitality, Luxury Resort marries classic architecture with contemporary comforts. From the moment you arrive you'll notice the attention to detail locally sourced materials, thoughtful service, and spaces that invite you to relax and reconnect.

We host discerning travelers from across the globe and curate experiences that celebrate the location’s natural beauty and culture.`
  );
  const [singularities, setSingularities] = useState<string[]>([
    "✨ Personalized Service",
    "🏆 Award-Winning Design",
    "🌱 Sustainable Practices",
  ]);
  const [mission, setMission] = useState<string>(
    "To provide restorative experiences through exceptional hospitality, design integrity, and meaningful local connections."
  );
  const [values, setValues] = useState<string>(
    "Warm, discreet service; Thoughtful sustainability; Artistic stewardship"
  );
  const [signatureExperience, setSignatureExperience] = useState<string>(
    "Bespoke itineraries, chef-led dining, and curated wellness offerings designed to leave a lasting impression."
  );
  const [stat1, setStat1] = useState<number>(150);
  const [stat2, setStat2] = useState<number>(40);
  const [stat3, setStat3] = useState<number>(98);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/general`, { signal });
        if (!res.ok) throw new Error("Failed to fetch about data");
        const data = await res.json();

        // Strings or arrays are accepted
        const remoteTitle = data?.["about.title"];
        const remoteDesc = data?.["about.description"];
        const remoteStory = data?.["about.story"];
        const remoteSing = data?.["about.singularity"];
        const remoteMission = data?.["about.mission"];
        const remoteValues = data?.["about.values"];
        const remoteSignature = data?.["about.signature_experience"];
        const remoteStat1 = data?.["about.stat1"];
        const remoteStat2 = data?.["about.stat2"];
        const remoteStat3 = data?.["about.stat3"];

        if (remoteTitle) {
          // title can be multiline or array
          if (Array.isArray(remoteTitle)) {
            const joined = remoteTitle.filter(Boolean).join("\n");
            if (joined.trim()) setTitle(joined);
          } else {
            const s = String(remoteTitle).trim();
            if (s) setTitle(s);
          }
        }

        if (remoteDesc && String(remoteDesc).trim())
          setDescription(String(remoteDesc));
        if (remoteStory && String(remoteStory).trim())
          setStory(String(remoteStory));
        const singArr = makeArray(remoteSing);
        if (singArr.length > 0) {
          setSingularities(
            singArr.map((s) =>
              s.startsWith("✨") || s.startsWith("🏆") || s.startsWith("🌱")
                ? s
                : s
            )
          );
        }

        if (remoteMission && String(remoteMission).trim())
          setMission(String(remoteMission));
        if (remoteValues && String(remoteValues).trim())
          setValues(String(remoteValues));
        if (remoteSignature && String(remoteSignature).trim())
          setSignatureExperience(String(remoteSignature));

        const n1 = toNumberSafe(remoteStat1, undefined as unknown as number);
        const n2 = toNumberSafe(remoteStat2, undefined as unknown as number);
        const n3 = toNumberSafe(remoteStat3, undefined as unknown as number);
        if (!Number.isNaN(n1) && n1 !== 0) setStat1(n1);
        if (!Number.isNaN(n2) && n2 !== 0) setStat2(n2);
        if (!Number.isNaN(n3) && n3 !== 0) setStat3(n3);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.warn("Could not load about data:", err);
      }
    })();

    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen font-serif text-gray-900">
      <header className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-black/80 text-white flex items-center justify-center font-bold">
            LR
          </div>
          <nav className="hidden lg:flex gap-6 text-sm text-white/90">
            <a className="hover:underline" href="#home">
              Home
            </a>
            <a className="hover:underline" href="#about">
              About
            </a>
            <a className="hover:underline" href="#services">
              Services
            </a>
            <a className="hover:underline" href="#contact">
              Contact
            </a>
          </nav>
        </div>
        <div>
          <button className="hidden lg:inline-block bg-white text-black rounded-md px-4 py-2 text-sm shadow">
            Book Now
          </button>
        </div>
      </header>
      <section
        className="relative h-[70vh] md:h-[68vh] lg:h-[72vh] bg-cover bg-center flex items-center"
        style={{
          backgroundImage: `linear-gradient(rgba(6,6,6,0.55), rgba(6,6,6,0.55)), url(${resortImg})`,
        }}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl text-white">
            <h1 className="text-4xl md:text-6xl leading-tight font-extrabold drop-shadow-lg">
              {title}
            </h1>
            <p className="mt-6 text-base md:text-lg text-white/90">
              {description}
            </p>
            <div className="mt-8 flex gap-4">
              <a
                href={`https://wa.me/96181635574?text=${encodeURIComponent(
                  "Hello 👋, I want to book a room — please help me with availability and prices."
                )}`}
                target="_blank"
                className="inline-block bg-transparent border border-white/60 text-white px-4 py-2 rounded-md text-sm"
              >
                Book a Room
              </a>
              <a
                href="#services"
                className="inline-block bg-white text-black px-4 py-2 rounded-md text-sm"
              >
                View Services
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="-mt-16 relative z-20">
        <div className="container mx-auto px-6 lg:px-12">
          {/* Our Story */}
          <section
            id="about"
            className="bg-white rounded-xl shadow-lg p-8 md:p-12 -mt-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold">Our Story</h2>
                <p className="mt-4 text-gray-700 leading-relaxed whitespace-pre-line">
                  {story}
                </p>
                {/* Grid cards */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {singularities.map((s, i) => (
                    <div
                      key={i}
                      className="p-4 bg-white rounded-xl border shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition"
                      role="article"
                      aria-label={s}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-sm font-semibold text-gray-800">
                          {s}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Description goes here.
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg overflow-hidden">
                <img
                  src={resortImg}
                  alt="Resort interior"
                  className="w-full h-72 object-cover md:h-96 rounded-lg shadow"
                />
              </div>
            </div>
          </section>

          {/* Mission & Values */}
          <section
            id="mission"
            className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="p-6 bg-white rounded-xl shadow">
              <h3 className="text-xl font-semibold">Our Mission</h3>
              <p className="mt-3 text-gray-600">{mission}</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow">
              <h3 className="text-xl font-semibold">Values</h3>
              <ul className="mt-3 text-gray-600 space-y-2">
                {String(values)
                  .split(/[;,•]/)
                  .filter(Boolean)
                  .map((v, i) => (
                    <li key={i}>• {v.trim()}</li>
                  ))}
              </ul>
            </div>
            <div className="p-6 bg-white rounded-xl shadow">
              <h3 className="text-xl font-semibold">Signature Experience</h3>
              <p className="mt-3 text-gray-600">{signatureExperience}</p>
            </div>
          </section>

          <section className="mt-12 p-8 rounded-xl bg-gradient-to-r from-white/60 via-white to-gray-50 shadow-lg">
            <div className="container mx-auto px-0 md:px-4 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex gap-8 w-full md:w-auto">
                <Stat
                  title="Rooms & Suites"
                  value={stat1}
                  suffix="+"
                  delay={0.0}
                />
                <Stat
                  title="Experiences Curated"
                  value={stat2}
                  suffix="+"
                  delay={0.15}
                />
                <Stat
                  title="Guest Satisfaction"
                  value={stat3}
                  suffix="%"
                  delay={0.3}
                />
              </div>

              <div className="w-full md:w-1/3">
                <div className="text-right md:text-left">
                  <h4 className="text-xl font-semibold">
                    Ready to experience Luxury Resort?
                  </h4>
                  <p className="text-gray-600 mt-2">
                    Book your stay or get in touch with our concierge to begin
                    planning.
                  </p>
                  <div className="mt-4 flex justify-end md:justify-start">
                    <a
                      className="inline-flex items-center gap-3 bg-black text-white px-5 py-3 rounded-full shadow-md transform hover:-translate-y-0.5 transition"
                      href={`https://wa.me/96181635574?text=${encodeURIComponent(
                        "Hello 👋, I want to book a room — please help me with availability and prices."
                      )}`}
                      target="_blank"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11.5V11a1 1 0 01-2 0V6.5a1 1 0 012 0zM10 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Reserve
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer CTA */}
          <section className="mt-16 mb-24 p-1 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-400">
            <div className="rounded-2xl bg-black/95 text-white p-8 md:p-12 shadow-2xl">
              <div className="max-w-4xl mx-auto text-center">
                <motion.h4
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="text-2xl md:text-3xl font-semibold"
                >
                  Experience timeless luxury
                </motion.h4>

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.12, duration: 0.6 }}
                  className="mt-3 text-white/90 max-w-2xl mx-auto"
                >
                  Contact our concierge to create a bespoke stay tailored to
                  you. We’ll handle everything from private transfers to
                  personalized menus.
                </motion.p>

                <div className="mt-6 flex items-center justify-center gap-4">
                  <motion.a
                    href={`https://wa.me/96181635574?text=${encodeURIComponent(
                      "Hello 👋, I want to book a room — please help me with availability and prices."
                    )}`}
                    target="_blank"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full font-medium shadow-lg"
                  >
                    Contact Concierge
                  </motion.a>

                  <motion.a
                    href="#book"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 border border-white/20 text-white px-5 py-3 rounded-full font-medium hover:bg-white/5 transition"
                  >
                    View Rooms
                  </motion.a>
                </div>

                <div className="mt-6 text-sm text-white/70">
                  Prefer to call?{" "}
                  <a href="tel:+123456789" className="underline">
                    +1 (xxx) xxx-xxxx
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
