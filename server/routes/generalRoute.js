import express from "express";
import getPool from "../db.js";
import multer from "multer";

const router = express.Router();

function tryParseValue(val) {
  if (val === null || val === undefined) return "";
  if (typeof val !== "string") return val;
  val = val.trim();
  if (!val) return "";
  try {
    const parsed = JSON.parse(val);
    return parsed;
  } catch (e) {
    return val;
  }
}

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

router.post("/", async (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Invalid payload" });
  }

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


router.get("/media", async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      "SELECT id, social_media_name AS name, social_media_link AS link FROM `media` ORDER BY id"
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /api/general/media error:", err);
    res.status(500).json({ error: "DB error" });
  }
});

router.post("/media", async (req, res) => {
  const list = req.body;
  if (!Array.isArray(list)) {
    return res.status(400).json({ error: "Expected an array" });
  }

  let conn = null;
  try {
    const pool = await getPool();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Remove existing rows (simple and clear: admin provides full list)
    await conn.query("DELETE FROM `media`");

    // Insert new rows (if any)
    const entries = list
      .map((it) => [
        it.social_media_name || it.name || "",
        it.social_media_link || it.link || "",
      ])
      .filter((e) => e[0] || e[1]); // skip empty rows

    if (entries.length) {
      await conn.query(
        "INSERT INTO `media` (`social_media_name`, `social_media_link`) VALUES ?",
        [entries]
      );
    }

    await conn.commit();
    res.json({ ok: true, count: entries.length });
  } catch (err) {
    console.error("POST /api/general/media error:", err);
    try {
      if (conn) await conn.rollback();
    } catch (e) {
      console.error("Rollback failed:", e);
    }
    res.status(500).json({ error: "DB error" });
  } finally {
    try {
      if (conn) conn.release();
    } catch (e) {
      console.error("Failed to release connection:", e);
    }
  }
});

// DELETE /api/general/media/:id
router.delete("/media/:id", async (req, res) => {
  const id = Number(req.params.id) || 0;
  if (!id) return res.status(400).json({ error: "Missing id" });
  try {
    const pool = await getPool();
    const [result] = await pool.query("DELETE FROM `media` WHERE id = ?", [id]);
    // result.affectedRows may be driver specific; keep it simple:
    res.json({ ok: true, deleted: (result && result.affectedRows) || 0 });
  } catch (err) {
    console.error("DELETE /api/general/media/:id error:", err);
    res.status(500).json({ error: "DB error" });
  }
});






router.get("/:key", async (req, res) => {
  const key = req.params.key;
  if (!key) return res.status(400).json({ error: "Missing key" });
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      "SELECT value FROM `general` WHERE `name` = ?",
      [key]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    const val = tryParseValue(rows[0].value);
    res.json({ name: key, value: val });
  } catch (err) {
    console.error("GET /api/general/:key error:", err);
    res.status(500).json({ error: "DB error" });
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}); // 10MB limit

router.post("/upload", upload.any(), async (req, res) => {
  let conn = null;
  try {
    const pool = await getPool();
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const textEntries = [];
    for (const [k, v] of Object.entries(req.body || {})) {
      const sval = v === null || v === undefined ? "" : String(v);
      textEntries.push([k, sval]);
    }

    if (textEntries.length) {
      const sqlText =
        "INSERT INTO `general` (`name`,`value`) VALUES ? ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)";
      await conn.query(sqlText, [textEntries]);
    }

    // Then handle files (each file -> upsert with photo and value_mime)
    const files = req.files || [];
    for (const f of files) {
      const fieldname = f.fieldname;
      const buffer = f.buffer;
      const mime = f.mimetype || null;

      const sqlFile =
        "INSERT INTO `general` (`name`,`value`,`photo`,`value_mime`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`), `photo`=VALUES(`photo`), `value_mime`=VALUES(`value_mime`)";
      await conn.query(sqlFile, [fieldname, "", buffer, mime]);
    }

    await conn.commit();
    res.json({
      ok: true,
      updatedText: textEntries.length,
      updatedFiles: files.length,
    });
  } catch (err) {
    console.error("POST /api/general/upload error:", err);
    try {
      if (conn) await conn.rollback();
    } catch (e) {
      console.error("Rollback failed:", e);
    }
    res.status(500).json({ error: "Upload failed" });
  } finally {
    try {
      if (conn) conn.release();
    } catch (e) {
      console.error("Failed to release connection:", e);
    }
  }
});

router.get("/image/:key", async (req, res) => {
  const key = req.params.key;
  const pool = await getPool();
  const [rows] = await pool.query("SELECT photo, value_mime FROM `general` WHERE name = ?", [key]);
  if (!rows.length || !rows[0].photo) return res.status(404).end();
  res.setHeader("Content-Type", rows[0].value_mime || "application/octet-stream");
  res.send(rows[0].photo);
});


////////////////////////////////////////////////////////////////////////////////////
// update
////////////////////////////////////////////////////////////////////////////////////





export default router;
