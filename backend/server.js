const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const User = require("./models/User");
const Reporte = require("./models/Reporte");
const Ruta = require("./models/Ruta");

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch(err => console.error("❌ Error de conexión:", err));

// ------------------ ENDPOINTS ------------------

// Login simple
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.status(401).json({ error: "Credenciales inválidas" });
  res.json({ role: user.role, username: user.username });
});

// Reporte de chofer
app.post("/reporte", async (req, res) => {
  const { choferId, ubicacion, estado } = req.body;
  const nuevoReporte = new Reporte({ choferId, ubicacion, estado });
  await nuevoReporte.save();
  res.json({ ok: true, msg: "Reporte recibido" });
});

// Supervisor asigna ruta
app.post("/ruta", async (req, res) => {
  const { supervisorId, choferId, puntos } = req.body;
  const nuevaRuta = new Ruta({ supervisorId, choferId, puntos });
  await nuevaRuta.save();
  res.json({ ok: true, msg: "Ruta asignada" });
});

// Ver reportes
app.get("/reportes", async (req, res) => {
  const reportes = await Reporte.find();
  res.json(reportes);
});

app.listen(4000, () => console.log("🚀 Backend corriendo en puerto 4000"));
