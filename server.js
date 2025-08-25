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

// Endpoints Backend
const Tarea = require("./models/Tarea");
const Placa = require("./models/Placa");

// Crear tarea (solo con placa)
app.post("/tareas", async (req, res) => {
  try {
    const { placa, sector, turno } = req.body;

    if (!placa || !sector || !turno) 
      return res.status(400).json({ error: "Campos obligatorios" });

    const tarea = new Tarea({ placa, sector, turno, estado: "pendiente" });
    await tarea.save();
    res.json({ ok: true, msg: "Tarea asignada ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error asignando tarea" });
  }
});

// Listar todas las tareas
app.get("/tareas", async (req, res) => {
  try {
    const tareas = await Tarea.find();
    res.json(tareas);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo tareas" });
  }
});

// Listar placas disponibles
app.get("/placas", async (req, res) => {
  try {
    const placas = await Placa.find({ activo: true });
    res.json(placas);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo placas" });
  }
});


// --------------------REGISTRAS NUEVAS PLACAS ------------------
const Placa = require("./models/Placa");

// Crear una nueva placa
app.post("/placas", async (req, res) => {
  try {
    const { placa, marca, modelo } = req.body;
    const nuevaPlaca = new Placa({ placa, marca, modelo });
    await nuevaPlaca.save();
    res.json({ ok: true, msg: "Vehículo registrado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error registrando la placa" });
  }
});

// Obtener todas las placas
app.get("/placas", async (req, res) => {
  try {
    const placas = await Placa.find();
    res.json(placas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo las placas" });
  }
});


// -------------------- PUERTO --------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en puerto ${PORT}`));
