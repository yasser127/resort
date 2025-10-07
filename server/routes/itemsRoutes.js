import express from "express";
import path from "path";
import fs from "fs";
import getPool from "../db.js";

const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query("SELECT id, name, price, description FROM items ORDER BY price DESC");
    const data = rows.map((r) => {
      return { id: r.id, name: r.name, price: r.price };
    });
    res.json({ ok: true, data });
  } catch (err) {
    console.error("GET /items error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const pool = await getPool();
    const { name, price, description } = req.body;
    if (!name || !price || !description) return res.status(400).json({ ok: false, error: "Missing name, price, or description" });

    const [result] = await pool.query(
      "INSERT INTO items (name, price, description) VALUES (?, ?, ?)",
      [name, price, description]
    );

    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("POST /items error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

