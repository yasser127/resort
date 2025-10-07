import express from "express";
import getPool from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

export function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.header("Authorization");
    if (!authHeader)
      return res.status(403).json({ message: "No authorization header" });

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer")
      return res
        .status(401)
        .json({ message: "Invalid authorization header format" });

    const token = parts[1];
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = decoded;
    req.id = decoded.id;
    next();
  } catch (err) {
    console.error("verifyToken error:", err?.message || err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Missing email or password" });

  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      "SELECT id, name, email, password FROM `user` WHERE email = ? LIMIT 1",
      [email]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];
    if (!user.password) {
      return res
        .status(500)
        .json({ message: "No password stored for this user" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const payload = { id: user.id, name: user.name, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: "48h" });

    return res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("POST /auth/login error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

// POST /auth/register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "Missing required fields" });

  try {
    const pool = await getPool();

    // check duplicate email
    const [existing] = await pool.query(
      "SELECT id FROM `user` WHERE email = ? LIMIT 1",
      [email]
    );
    if (existing && existing.length > 0) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO `user` (name, email, password) VALUES (?, ?, ?)",
      [name, email, hash]
    );

    return res
      .status(201)
      .json({ message: "User created", userId: result.insertId });
  } catch (err) {
    console.error("POST /auth/register error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

// GET /auth/me
router.get("/me", verifyToken, async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      "SELECT id, name, email FROM `user` WHERE id = ? LIMIT 1",
      [req.id]
    );

    if (!rows || rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const u = rows[0];
    return res
      .status(200)
      .json({ user: { id: u.id, name: u.name, email: u.email } });
  } catch (err) {
    console.error("GET /auth/me error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

export default router;
