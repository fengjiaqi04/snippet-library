const express = require("express");
const { z } = require("zod");
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Helpers
async function getDefaultWorkspaceId(userId) {
  const ws = await pool.query(
    "SELECT id FROM workspaces WHERE owner_id=$1 ORDER BY created_at ASC LIMIT 1",
    [userId]
  );
  return ws.rows[0]?.id || null;
}

// --- Create snippet ---
const CreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
  language: z.string().optional().default("javascript"),
  tags: z.array(z.string()).optional().default([]),
  code: z.string().min(1),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { title, description, language, tags, code } = parsed.data;

  // Create default workspace if needed (idempotent-ish)
  const ws = await pool.query(
    "INSERT INTO workspaces (name, owner_id, invite_code) VALUES ($1,$2,$3) ON CONFLICT (invite_code) DO NOTHING RETURNING id",
    ["My Workspace", req.user.id, `invite_${req.user.id.slice(0, 8)}`]
  );

  // If workspace already existed, fetch it
  const wsId =
    ws.rows[0]?.id ||
    (
      await pool.query(
        "SELECT id FROM workspaces WHERE owner_id=$1 ORDER BY created_at ASC LIMIT 1",
        [req.user.id]
      )
    ).rows[0].id;

  const result = await pool.query(
    `INSERT INTO snippets
      (workspace_id, title, description, language, tags, code, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$7)
     RETURNING *`,
    [wsId, title, description, language, tags, code, req.user.id]
  );

  res.json({ snippet: result.rows[0] });
});

// --- List snippets (latest first) ---
router.get("/", requireAuth, async (req, res) => {
  const wsId = await getDefaultWorkspaceId(req.user.id);
  if (!wsId) return res.json({ snippets: [] });

  const result = await pool.query(
    "SELECT * FROM snippets WHERE workspace_id=$1 ORDER BY updated_at DESC LIMIT 50",
    [wsId]
  );

  res.json({ snippets: result.rows });
});

// --- Search snippets (simple full-text) ---
router.get("/search", requireAuth, async (req, res) => {
  const q = String(req.query.q || "").trim();
  const wsId = await getDefaultWorkspaceId(req.user.id);

  if (!wsId) return res.json({ snippets: [] });
  if (!q) return res.json({ snippets: [] });

  const result = await pool.query(
    `SELECT * FROM snippets
     WHERE workspace_id=$1
       AND search_tsv @@ websearch_to_tsquery('english', $2)
     ORDER BY updated_at DESC
     LIMIT 50`,
    [wsId, q]
  );

  res.json({ snippets: result.rows });
});

// =======================
// ✅ Edit + Delete added
// =======================

const IdSchema = z.string().regex(/^\d+$/, "id must be a number");

// allow partial updates, but require at least one field
const UpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    language: z.string().min(1).optional(),
    tags: z.array(z.string()).optional(),
    code: z.string().min(1).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "No fields to update",
  });

// --- Update snippet ---
router.put("/:id", requireAuth, async (req, res) => {
  const idParsed = IdSchema.safeParse(req.params.id);
  if (!idParsed.success) return res.status(400).json({ error: "Invalid id" });
  const id = Number(idParsed.data);

  const bodyParsed = UpdateSchema.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });

  const wsId = await getDefaultWorkspaceId(req.user.id);
  if (!wsId) return res.status(404).json({ error: "Workspace not found" });

  const patch = bodyParsed.data;

  // Build dynamic UPDATE (only update provided fields)
  const fields = [];
  const values = [];
  let i = 1;

  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k}=$${i++}`);
    values.push(v);
  }

  // updated_by + updated_at
  fields.push(`updated_by=$${i++}`);
  values.push(req.user.id);
  fields.push(`updated_at=NOW()`);

  // WHERE constraints: snippet belongs to your workspace
  values.push(wsId); // $i
  const wsIdx = i++;
  values.push(id); // $i
  const idIdx = i++;

  const result = await pool.query(
    `UPDATE snippets
     SET ${fields.join(", ")}
     WHERE workspace_id=$${wsIdx} AND id=$${idIdx}
     RETURNING *`,
    values
  );

  if (result.rowCount === 0) return res.status(404).json({ error: "Snippet not found" });
  res.json({ snippet: result.rows[0] });
});

// --- Delete snippet ---
router.delete("/:id", requireAuth, async (req, res) => {
  const idParsed = IdSchema.safeParse(req.params.id);
  if (!idParsed.success) return res.status(400).json({ error: "Invalid id" });
  const id = Number(idParsed.data);

  const wsId = await getDefaultWorkspaceId(req.user.id);
  if (!wsId) return res.status(404).json({ error: "Workspace not found" });

  const result = await pool.query(
    "DELETE FROM snippets WHERE workspace_id=$1 AND id=$2 RETURNING id",
    [wsId, id]
  );

  if (result.rowCount === 0) return res.status(404).json({ error: "Snippet not found" });
  res.json({ ok: true });
});

module.exports = router;
