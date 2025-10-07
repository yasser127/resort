import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeneralsRaw = Record<string, any>;

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";



function Label({
  children,
  small,
}: {
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <label
      className={`${small ? "text-xs" : "text-sm"} font-medium text-gray-700`}
    >
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition resize-vertical"
    />
  );
}

/* ----------------- MultiList (for multiple slogans / singularities) ----------------- */

function MultiList({
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  function updateAt(idx: number, v: string) {
    const next = [...items];
    next[idx] = v;
    onChange(next);
  }
  function addItem() {
    onChange([...items, ""]);
  }
  function removeAt(idx: number) {
    const next = items.filter((_, i) => i !== idx);
    onChange(next);
  }
  return (
    <div className="space-y-2 ">
      {items.length === 0 ? (
        <div className="text-xs text-gray-400">No items yet — add one.</div>
      ) : null}

      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <input
              value={it}
              onChange={(e) => updateAt(idx, e.target.value)}
              placeholder={placeholder || "Enter text"}
              className="flex-1 bg-white border w-1 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition"
            />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="text-sm text-rose-600 bg-rose-50 px-3 py-1 rounded-md hover:bg-rose-100"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={addItem}
          className="text-sm inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
        >
          + {addLabel || "Add"}
        </button>
      </div>
    </div>
  );
}

/* ----------------- Card ----------------- */

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="bg-gradient-to-br from-white to-slate-50 border border-gray-100 rounded-2xl p-5 shadow-md"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          {subtitle ? (
            <div className="text-xs text-gray-400">{subtitle}</div>
          ) : null}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </motion.div>
  );
}

/* ----------------- Main component ----------------- */

export default function GeneralForm() {
  const [form, setForm] = useState<GeneralsRaw>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API_BASE}/api/general`, { signal });
        if (!r.ok) throw new Error("Fetch failed");
        const data = await r.json();

        // Normalize multi fields into arrays if they are strings (so UI always has arrays)
        const normalized: GeneralsRaw = { ...data };

        // fields that should be arrays
        const ARRAY_KEYS = ["slogan1", "slogan2", "about.singularity"];
        for (const k of ARRAY_KEYS) {
          const v = normalized[k];
          if (Array.isArray(v)) {
            // ok
          } else if (v === undefined || v === null || v === "") {
            normalized[k] = [];
          } else {
            // single value (string/number) -> convert to single-element array
            normalized[k] = [String(v)];
          }
        }

        // also ensure any missing keys exist as empty strings / arrays to simplify binding
        const ensureKeys = [
          "home.title",
          "home.description",
          "home.country",
          "home.address",
          "home.phone",
          "services.title",
          "footer.name",
          "footer.description",
          "footer.phone",
          "footer.email",
          "footer.address",
          "footer.invitation",
          "about.title",
          "about.description",
          "about.story",
          "about.mission",
          "about.values",
          "about.signature_experience",
          "about.stat1",
          "about.stat2",
          "about.stat3",
        ];
        ensureKeys.forEach((k) => {
          if (!(k in normalized)) normalized[k] = "";
        });

        setForm(normalized);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.warn("Could not load generals:", err);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function updateField(key: string, value: any) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    setStatus("saving");
    try {
      // Build payload: keep arrays as arrays, strings stay strings
      const payload: GeneralsRaw = {};
      for (const [k, v] of Object.entries(form)) {
        // skip undefined
        if (v === undefined) continue;
        payload[k] = v;
      }

      const res = await fetch(`${API_BASE}/api/general`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      setStatus("saved");
      setSavedAt(Date.now());
      setTimeout(() => setStatus("idle"), 1400);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 1800);
    }
  }

  // helpers to read fields safely
  const get = (k: string) => (form && form[k] !== undefined ? form[k] : "");

  return (
    <form onSubmit={handleSave} className="max-w-6xl mx-auto p-6 relative">
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.92 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-white"
          >
            <div className="flex items-center gap-3">
              <svg
                className="animate-spin h-6 w-6 text-indigo-600"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-20"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d="M4 12a8 8 0 018-8"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="text-sm text-gray-700">Loading content…</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Site Generals · Admin
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Edit site-wide content — multiple slogans & singularities supported.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-gray-400">
            
            {savedAt ? (
              <div className="text-[11px] text-gray-400 mt-1">
                Last: {new Date(savedAt).toLocaleString()}
              </div>
            ) : null}
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            disabled={status === "saving" || loading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-white shadow-md ${
              status === "saved"
                ? "bg-emerald-500"
                : status === "saving" || loading
                ? "bg-indigo-600"
                : "bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600"
            }`}
          >
            {status === "saving" ? (
              <svg
                className="animate-spin h-4 w-4 text-white"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-20"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d="M4 12a8 8 0 018-8"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            ) : status === "saved" ? (
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
            <span className="font-medium">
              {status === "saving"
                ? "Saving..."
                : status === "saved"
                ? "Saved"
                : "Save changes"}
            </span>
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* left column */}
        <div className="space-y-6">
          <Card title="Home" subtitle="Primary landing">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={String(get("home.title") || "")}
                  onChange={(v) => updateField("home.title", v)}
                  placeholder="Welcome to our resort"
                />
              </div>

              <div>
                <Label>Country</Label>
                <Input
                  value={String(get("home.country") || "")}
                  onChange={(v) => updateField("home.country", v)}
                  placeholder="Lebanon"
                />
              </div>

              <div>
                <Label>Address</Label>
                <Input
                  value={String(get("home.address") || "")}
                  onChange={(v) => updateField("home.address", v)}
                  placeholder="Street, City"
                />
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                  value={String(get("home.phone") || "")}
                  onChange={(v) => updateField("home.phone", v)}
                  placeholder="+961-7-xxx-xxxx"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Description</Label>
                <TextArea
                  value={String(get("home.description") || "")}
                  onChange={(v) => updateField("home.description", v)}
                  placeholder="Short homepage description"
                  rows={5}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {String(get("home.description") || "").length} characters
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Slogans"
            subtitle="You can add multiple slogans for each field"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Slogan group 1</Label>
                <MultiList
                  items={Array.isArray(get("slogan1")) ? get("slogan1") : []}
                  onChange={(items) => updateField("slogan1", items)}
                  placeholder="Slogan text"
                  addLabel="Add slogan"
                />
              </div>
              <div>
                <Label>Slogan group 2</Label>
                <MultiList
                  items={Array.isArray(get("slogan2")) ? get("slogan2") : []}
                  onChange={(items) => updateField("slogan2", items)}
                  placeholder="Slogan text"
                  addLabel="Add slogan"
                />
              </div>
            </div>
          </Card>

          <Card title="Services" subtitle="Services heading">
            <Label>Services title</Label>
            <Input
              value={String(get("services.title") || "")}
              onChange={(v) => updateField("services.title", v)}
              placeholder="Our premium services"
            />
          </Card>
        </div>

        {/* right column */}
        <div className="space-y-6">
          <Card title="Footer" subtitle="Contact & invite">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={String(get("footer.name") || "")}
                  onChange={(v) => updateField("footer.name", v)}
                  placeholder="Company / Resort"
                />
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                  value={String(get("footer.phone") || "")}
                  onChange={(v) => updateField("footer.phone", v)}
                  placeholder="+961-7-xxx-xxxx"
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  value={String(get("footer.email") || "")}
                  onChange={(v) => updateField("footer.email", v)}
                  placeholder="hello@resort.com"
                />
              </div>

              <div>
                <Label>Address</Label>
                <Input
                  value={String(get("footer.address") || "")}
                  onChange={(v) => updateField("footer.address", v)}
                  placeholder="Street, City"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Description</Label>
                <TextArea
                  value={String(get("footer.description") || "")}
                  onChange={(v) => updateField("footer.description", v)}
                  placeholder="Small footer blurb"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Invitation line</Label>
                <Input
                  value={String(get("footer.invitation") || "")}
                  onChange={(v) => updateField("footer.invitation", v)}
                  placeholder="Join us for a memorable stay"
                />
              </div>
            </div>
          </Card>

          <Card
            title="About"
            subtitle="Story, mission & multiple singularities"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={String(get("about.title") || "")}
                  onChange={(v) => updateField("about.title", v)}
                  placeholder="About us"
                />
              </div>

              <div>
                <Label>Signature Experience</Label>
                <Input
                  value={String(get("about.signature_experience") || "")}
                  onChange={(v) => updateField("about.signature_experience", v)}
                  placeholder="Signature Experience"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Description</Label>
                <TextArea
                  value={String(get("about.description") || "")}
                  onChange={(v) => updateField("about.description", v)}
                  placeholder="Short description"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Story</Label>
                <TextArea
                  value={String(get("about.story") || "")}
                  onChange={(v) => updateField("about.story", v)}
                  placeholder="Longer story content"
                  rows={4}
                />
              </div>

              <div>
                <Label>Singularities</Label>
                <MultiList
                  items={
                    Array.isArray(get("about.singularity"))
                      ? get("about.singularity")
                      : []
                  }
                  onChange={(items) => updateField("about.singularity", items)}
                  placeholder="e.g. 🏝️ Cozy atmosphere"
                  addLabel="Add singularity"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Our Mission</Label>
                <TextArea
                  value={String(get("about.mission") || "")}
                  onChange={(v) => updateField("about.mission", v)}
                  placeholder="Mission statement"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Values</Label>
                <TextArea
                  value={String(get("about.values") || "")}
                  onChange={(v) => updateField("about.values", v)}
                  placeholder="Core values, comma separated"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label small>Stat 1</Label>
                  <Input
                    value={String(get("about.stat1") || "")}
                    onChange={(v) => updateField("about.stat1", v)}
                    placeholder="1200"
                  />
                </div>
                <div>
                  <Label small>Stat 2</Label>
                  <Input
                    value={String(get("about.stat2") || "")}
                    onChange={(v) => updateField("about.stat2", v)}
                    placeholder="350+"
                  />
                </div>
                <div>
                  <Label small>Stat 3</Label>
                  <Input
                    value={String(get("about.stat3") || "")}
                    onChange={(v) => updateField("about.stat3", v)}
                    placeholder="5-star rating"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-400">
        <span>
          Click{" "}
          <span className="font-semibold text-gray-700">Save changes</span> to
          persist updates to your DB.
        </span>
      </div>

      <AnimatePresence>
        {status === "saved" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.28 }}
            className="fixed left-1/2 -translate-x-1/2 bottom-8 z-50"
          >
            <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg">
              Saved successfully
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
