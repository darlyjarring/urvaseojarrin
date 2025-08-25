// -------------------- IMPORTS --------------------
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// -------------------- MODELOS --------------------
const User = require("./models/User");
const Reporte = require("./models/Reporte");
const Ruta = require("./models/Ruta");

// -------------------- CONFIG APP --------------------
const app = express();
app.use(cors());
app.use(express.json());

// -------------------- SERVIR FRONTEND --------------------
// Todos los archivos HTML, CSS, JS de la carpeta 'frontend'
app.use(express.static("frontend"));

// Rutas específicas para cada página HTML
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/frontend/index.html");
});

app.get("/index.html", (req, res) => {
  res.sendFile(__dirname + "/frontend/index.html");
});

app.get("/chofer.html", (req, res) => {
  res.sendFile(__dirname + "/frontend/chofer.html");
});

app.get("/supervisor.html", (req, res) => {
  res.sendFile(__dirname + "/frontend/supervisor.html");
});

// -------------------- CONEXIÓN A MONGODB --------------------
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("❌ Error: la variable MONGO_URI no está definida en .env");
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch(err => {
    console.error("❌ Error de conexión:", err);
    process.exit(1);
  });

// -------------------- ENDPOINTS --------------------

// Login simple
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });
    res.json({ role: user.role, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Reporte de chofer
app.post("/reporte", async (req, res) => {
  try {
    const { choferId, ubicacion, estado } = req.body;
    const nuevoReporte = new Reporte({ choferId, ubicacion, estado });
    await nuevoReporte.save();
    res.json({ ok: true, msg: "Reporte recibido" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Supervisor asigna ruta
app.post("/ruta", async (req, res) => {
  try {
    const { supervisorId, choferId, puntos } = req.body;
    const nuevaRuta = new Ruta({ supervisorId, choferId, puntos });
    await nuevaRuta.save();
    res.json({ ok: true, msg: "Ruta asignada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Ver reportes
app.get("/reportes", async (req, res) => {
  try {
    const reportes = await Reporte.find();
    res.json(reportes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Registro de usuario
app.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validar datos
    if (!username || !password || !role) {
      return res.status(400).json({ error: "Faltan datos (username, password, role)" });
    }

    // Crear usuario
    const newUser = new User({ username, password, role });
    await newUser.save();

    res.json({ ok: true, msg: "Usuario registrado con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});



// -------------------- PUERTO --------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en puerto ${PORT}`));
