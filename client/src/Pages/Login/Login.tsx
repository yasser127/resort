import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; server?: string }>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email) next.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email.";

    if (!password) next.password = "Password is required.";
    else if (password.length < 6) next.password = "Password must be at least 6 characters.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
     
      const API_BASE = "http://localhost:3000"; 
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
       
        setErrors((prev) => ({ ...prev, server: data.message || "Login failed" }));
        setLoading(false);
        return;
      }

     
      if (data.token) {
        localStorage.setItem("token", data.token); 
        
        localStorage.setItem("user", JSON.stringify(data.user || {}));
       
        navigate("/", { replace: true });
      } else {
        setErrors((prev) => ({ ...prev, server: "No token received from server" }));
      }
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, server: err.message || "Network error" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight">Admin Side</h1>
            <p className="mt-1 text-sm text-gray-500">Sign in to continue to your account</p>
          </div>

          {errors.server && <div className="mb-4 text-sm text-red-600">{errors.server}</div>}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <label className="sr-only" htmlFor="email">Email</label>
            <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${errors.email ? "border-red-400" : "border-gray-200"}`}>
              <Mail size={18} className="text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-transparent outline-none text-sm"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </div>
            {errors.email && <p id="email-error" className="text-xs text-red-500">{errors.email}</p>}

            <label className="sr-only" htmlFor="password">Password</label>
            <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${errors.password ? "border-red-400" : "border-gray-200"}`}>
              <Lock size={18} className="text-gray-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full bg-transparent outline-none text-sm"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Hide password" : "Show password"} className="p-1 rounded-md hover:bg-gray-100">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p id="password-error" className="text-xs text-red-500">{errors.password}</p>}

            <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-white px-4 py-3 font-medium shadow hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
