import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  Home,
  LogIn,
  LogOut,
  Menu,
  X,
  BookType,
  HandPlatter,
  Bed,
  CookingPot,
 // WavesLadder,
 // Dumbbell,
  Star,
} from "lucide-react";

type LinkDef = { to: string; label: string; icon: React.ComponentType };

const LINKS: LinkDef[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/generals", label: "Generals", icon: BookType },
  { to: "/service", label: "Service", icon: HandPlatter },
  { to: "/room", label: "Rooms", icon: Bed },
  { to: "/items", label: "Items", icon: CookingPot },
 // { to: "/pool", label: "Pool", icon: WavesLadder },
 // { to: "/gym", label: "Gym", icon: Dumbbell },
  { to: "/reviews", label: "Reviews", icon: Star },
];

const SidebarContent: React.FC<{
  collapsed: boolean;
  links: LinkDef[];
  loggedIn: boolean;
  onLogout: (e?: React.MouseEvent) => void;
  onNavClose?: () => void;
}> = ({ collapsed, links, loggedIn, onLogout, onNavClose }) => (
  <div className="flex flex-col h-full ">
    <nav className="flex-1 overflow-y-auto px-2 py-4 pt-20">
      <ul className="space-y-1">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <li key={l.to} className="px-1">
              <NavLink
                to={l.to}
                end={l.to === "/"}
                onClick={onNavClose}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 px-3 py-2 rounded-md mx-1 transition-colors duration-150",
                    isActive
                      ? "bg-amber-200 ring-1 ring-amber-300 text-amber-900"
                      : "hover:bg-amber-600 text-amber-200",
                  ].join(" ")
                }
              >
                <Icon />
                <span
                  className={`font-medium transition-opacity duration-200 ${
                    collapsed
                      ? "opacity-0 pointer-events-none hidden"
                      : "opacity-100"
                  }`}
                >
                  {l.label}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>

    <div
      className="px-3 py-4 border-t"
      style={{ borderColor: "rgba(0,0,0,0.06)" }}
    >
      {loggedIn ? (
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md bg-amber-50 hover:bg-amber-100 transition-colors duration-150 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-5 h-5 text-amber-900" />
          <span
            className={`${
              collapsed ? "hidden" : "font-semibold text-amber-900"
            }`}
          >
            Logout
          </span>
        </button>
      ) : (
        <NavLink
          to="/admin_gate"
          onClick={onNavClose}
          className={({ isActive }) =>
            [
              "w-full inline-flex items-center gap-3 px-3 py-2 rounded-md font-semibold",
              isActive
                ? "bg-amber-300 text-white"
                : "bg-white text-amber-900 hover:opacity-95",
            ].join(" ")
          }
        >
          <LogIn className="w-5 h-5" />
          <span className={`${collapsed ? "hidden" : ""}`}>Login</span>
        </NavLink>
      )}
    </div>
  </div>
);

const AdminPanel: React.FC = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const visibleLinks = useMemo(() => {
    if (!token) return [];
    return LINKS;
  }, [token]);

  const [loggedIn, setLoggedIn] = useState<boolean>(() => !!token);
  const [open, setOpen] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  const navigate = useNavigate();

  useEffect(() => {
    const onStorage = (e: StorageEvent) =>
      e.key === "token" && setLoggedIn(!!e.newValue);
    const onVisibility = () => setLoggedIn(!!localStorage.getItem("token"));
    const onResize = () => setIsMobile(window.innerWidth < 768);

    window.addEventListener("storage", onStorage);
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const width = isMobile ? 0 : open ? 256 : 0;
      document.documentElement.style.setProperty(
        "--sidebar-width",
        `${width}px`
      );
      document.body.style.overflow = isMobile && open ? "hidden" : "";
    }
    return () => {
      if (typeof document !== "undefined") document.body.style.overflow = "";
    };
  }, [open, isMobile]);

  const logout = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      localStorage.removeItem("token");
      setLoggedIn(false);
      setOpen(false);
      navigate("/admin_gate");
    },
    [navigate]
  );

  return (
    <div >
      <button
        aria-expanded={open}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        onClick={() => setOpen((s) => !s)}
        className="fixed top-4 left-4 z-60 inline-flex items-center justify-center p-2 rounded-lg shadow-lg transition-transform duration-150"
        style={{
          background: "linear-gradient(180deg,#f59e0b,#b45309)",
          color: "white",
        }}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* mobile backdrop */}
      {isMobile && (
        <div
          role="button"
          aria-hidden={!open}
          onClick={() => setOpen(false)}
          className={`fixed inset-0 z-40 transition-opacity ${
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{
            background: "rgba(0,0,0,0.35)",
            transition: "opacity .18s ease",
          }}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : -256 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="fixed left-0 top-0 bottom-0 z-50 overflow-hidden"
        style={{
          width: 256,
          maxWidth: "50vw",
          boxSizing: "border-box",
          minHeight: "100vh",
          willChange: "transform",
        }}
      >
        <div style={{ width: 256, overflow: "hidden", height: "100%" }}>
          <div
            className="h-full bg-gradient-to-b from-amber-900 to-amber-600"
            style={{ color: "#7c2d12" }}
          >
            <SidebarContent
              collapsed={!open}
              links={visibleLinks}
              loggedIn={loggedIn}
              onLogout={logout}
              onNavClose={() => {
                if (window.innerWidth < 768) setOpen(false);
              }}
            />
          </div>
        </div>
      </motion.aside>
    </div>
  );
};

export default AdminPanel;
