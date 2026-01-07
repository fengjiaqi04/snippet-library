const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");



dotenv.config();
const authRoutes = require("./routes/auth");
const snippetsRoutes = require("./routes/snippets");


const { pool } = require("./db");



const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, cb) {
      // allow curl / server-to-server requests (no origin)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);


app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT || 3000;

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, now: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use("/api/auth", authRoutes);

app.use("/api/snippets", snippetsRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
