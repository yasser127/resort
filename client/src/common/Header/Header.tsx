import React, { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`fixed top-0 left-0 w-full z-50 pointer-events-auto transition-colors duration-300 ${
        scrolled ? "backdrop-blur-md bg-black/40" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
       
        <a href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
            <span className="font-serif text-white text-lg">LR</span>
          </div>
          <span className="hidden md:inline-block text-white font-medium tracking-wide">
            Luxury Resort
          </span>
        </a>

       
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="#home" className="text-white/90 hover:text-white transition">
            Home
          </a>
          <a href="about" className="text-white/70 hover:text-white transition">
            About
          </a>
          <a href="#services" className="text-white/70 hover:text-white transition">
            Services
          </a>
          <a href="#services" className="text-white/70 hover:text-white transition">
            Resturant
          </a>
          <a href="#services" className="text-white/70 hover:text-white transition">
            Pool
          </a>
          <a href="#services" className="text-white/70 hover:text-white transition">
            Gym
          </a>
          <a href="#contact" className="text-white/70 hover:text-white transition">
            Contact
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Removed the login button as requested */}

          <a
            href="#book"
            className="hidden md:inline-flex items-center px-4 py-2 rounded-lg bg-white text-black font-medium shadow-sm hover:scale-[1.01] transition-transform"
          >
            Book Now
          </a>

          {/* Mobile menu button */}
          <button className="md:hidden text-white/90 p-2">
            <Menu size={22} />
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
