import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import "./App.css";
import Home from "./Pages/Home/Home";
import LoginCard from "./Pages/Login/Login";

import ServicesAdmin from "./Pages/Admin/ServiceManeger/Service";
import RoomsManeger from "./Pages/Admin/RoomManeger/RoomManeger";
import AdminPanel from "./common/Admin/AdminPanel";
import ReviewsManeger from "./Pages/Admin/ReviewsManeger/ReviewsManeger";

type DashboardLayoutProps = { isLoggedIn: boolean };

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ isLoggedIn }) => {
  return (
    <div className="min-h-screen  bg-gray-50">
      {isLoggedIn && <AdminPanel />}
      <main className={`min-h-screen ${isLoggedIn ? "main-with-sidebar" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    Boolean(localStorage.getItem("token"))
  );
  useEffect(() => {
    const handler = () => setIsLoggedIn(Boolean(localStorage.getItem("token")));
    window.addEventListener("authChange", handler);
    return () => window.removeEventListener("authChange", handler);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin_gate" element={<LoginCard />} />
        <Route element={<DashboardLayout isLoggedIn={isLoggedIn} />}>
          <Route index element={<Home />} />
          {isLoggedIn && <Route path="service" element={<ServicesAdmin />} />}
          {isLoggedIn && <Route path="room" element={<RoomsManeger />} />}
          {isLoggedIn && <Route path="reviews" element={<ReviewsManeger />} />}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
