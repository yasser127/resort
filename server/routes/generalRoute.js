// routes/generalRoute.js
import express from "express";
import getPool from "../db.js";

const router = express.Router();

/**
 * Helper: try to parse JSON values coming from DB. If parse fails, return raw string.
 */
function tryParseValue(val) {
  if (val === null || val === undefined) return "";
  if (typeof val !== "string") return val;
  val = val.trim();
  if (!val) return "";
  try {
    const parsed = JSON.parse(val);
    return parsed;
  } catch (e) {
    // not JSON -> return original string
    return val;
  }
}

/**
 * GET /api/general
 * Returns an object of all general entries { name: value, ... }
 * where value may be a string or a parsed object/array.
 */
router.get("/", async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query("SELECT name, value FROM `general`");
    const out = {};
    rows.forEach((r) => {
      out[r.name] = tryParseValue(r.value);
    });
    res.json(out);
  } catch (err) {
    console.error("GET /api/general error:", err);
    res.status(500).json({ error: "DB error" });
  }
});

/**
 * POST /api/general
 * Bulk upsert of key/value pairs.
 * Body: { "home.title": "My title", "slogan1": ["a","b"], "about.singularity": ["x","y"] ... }
 * Arrays and objects are stored as JSON strings in the DB.
 */
router.post("/", async (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Invalid payload" });
  }

  // Normalize entries: arrays/objects -> JSON string, others -> string
  const entries = Object.entries(payload).map(([k, v]) => {
    if (v === null || v === undefined) return [k, ""];
    if (typeof v === "object") {
      try {
        return [k, JSON.stringify(v)];
      } catch (e) {
        return [k, String(v)];
      }
    } else {
      return [k, String(v)];
    }
  });

  if (entries.length === 0) return res.json({ updated: 0 });

  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const sql =
      "INSERT INTO `general` (`name`,`value`) VALUES ? ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)";
    await conn.query(sql, [entries]);
    await conn.commit();
    res.json({ updated: entries.length });
  } catch (err) {
    await conn.rollback();
    console.error("POST /api/general error:", err);
    res.status(500).json({ error: "DB upsert failed" });
  } finally {
    conn.release();
  }
});

/**
 * GET /api/general/:key  -> get a single value (parsed)
 */
router.get("/:key", async (req, res) => {
  const key = req.params.key;
  if (!key) return res.status(400).json({ error: "Missing key" });
  try {
    const pool = await getPool();
    const [rows] = await pool.query("SELECT value FROM `general` WHERE `name` = ?", [key]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    const val = tryParseValue(rows[0].value);
    res.json({ name: key, value: val });
  } catch (err) {
    console.error("GET /api/general/:key error:", err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
