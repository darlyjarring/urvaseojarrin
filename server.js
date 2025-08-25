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

app.get("/admin.html", (req, res) => {
  res.sendFile(__dirname + "/frontend/admin.html");
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

// ----------------- TURNOS ---------------------
const Asignacion = require("./models/Asignacion");

app.post("/login", async (req, res) => {
  try {
    const { username, password, placa } = req.body;
    const user = await User.findOne({ username, password });

    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });
    if (!placa) return res.status(400).json({ error: "Debe indicar la placa asignada" });

    // Detectar turno según hora actual
    const hora = new Date().getHours();
    let turno;
    if (hora >= 7 && hora < 15) turno = "07:00-15:00";
    else if (hora >= 15 && hora < 23) turno = "15:00-23:00";
    else turno = "23:00-07:00";

    // Registrar asignación del chofer a la placa
    const asignacion = new Asignacion({ choferId: user._id, placa, turno });
    await asignacion.save();

    res.json({ role: user.role, username: user.username, turno, placa });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en login" });
  }
});

// --------------- CHOFERES ACTIVOS}

// Listar choferes activos (con placa y turno asignado)
app.get("/supervisor/choferes-activos", async (req, res) => {
  try {
    const choferes = await Asignacion.find({})
      .populate("choferId", "username")
      .populate("placa", "placa")
      .sort({ fecha: -1 })
      .limit(20);

    const resultado = choferes.map(c => ({
      _id: c.choferId._id,
      nombre: c.choferId.username,
      placa: c.placa,
      turno: c.turno
    }));

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo choferes activos" });
  }
});

// CHOFERES TAREA SUPERVIOR VISUALIZA
// Listar tareas de un chofer específico
app.get("/supervisor/tareas/:choferId", async (req, res) => {
  try {
    const { choferId } = req.params;

    // Primero, encontramos la asignación para obtener la placa y el turno del chofer
    const asignacion = await Asignacion.findOne({ choferId }).sort({ fecha: -1 });

    if (!asignacion) {
      return res.status(404).json({ error: "No se encontró una asignación para este chofer" });
    }

    const { placa, turno } = asignacion;

    // Luego, buscamos las tareas asignadas a esa placa y turno
    const tareas = await Tarea.find({ placa, turno });

    res.json(tareas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo las tareas del chofer" });
  }
});
// -------------------- PUERTO --------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en puerto ${PORT}`));
