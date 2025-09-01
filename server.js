// -------------------- IMPORTS --------------------
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs"); // Importamos bcryptjs
require("dotenv").config();

// -------------------- MODELOS --------------------
const User = require("./models/User");
const Reporte = require("./models/Reporte");
const Ruta = require("./models/Ruta");
const Tarea = require("./models/Tarea");
const Placa = require("./models/Placa");
const Asignacion = require("./models/Asignacion");

// -------------------- CONFIG APP --------------------
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("frontend"));

// -------------------- SERVIR FRONTEND --------------------
app.get("/", (req, res) => {
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
  .catch((err) => {
    console.error("❌ Error de conexión a MongoDB:", err);
    process.exit(1);
  });

// -------------------- ENDPOINTS --------------------

// Endpoint para verificar rol
app.post("/check-role", async (req, res) => {
  try {
    const { email } = req.body;
    // Corregido: Buscar por el campo 'username' en la base de datos
    const user = await User.findOne({ username: email });
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }
    res.json({ ok: true, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al verificar el rol" });
  }
});

// Endpoint para el login
app.post("/login", async (req, res) => {
  try {
    const { email, password, placa } = req.body;
    
    // Corregido: Buscar por el campo 'username' en la base de datos
    const user = await User.findOne({ username: email });

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    if (user.role === "chofer" && !placa) {
      return res.status(400).json({ error: "Debe indicar la placa asignada." });
    }
    
    res.json({
      ok: true,
      id: user._id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      role: user.role,
      placa: user.placa,
      turno: user.turno,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor al iniciar sesión" });
  }
});

// -------------------- RUTAS --------------------
app.post("/rutas", async (req, res) => {
  try {
    const nuevaRuta = new Ruta(req.body);
    await nuevaRuta.save();
    res.status(201).json({ ok: true, msg: "Ruta creada", ruta: nuevaRuta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando la ruta" });
  }
});

app.get("/rutas", async (req, res) => {
  try {
    const rutas = await Ruta.find({});
    res.json(rutas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo las rutas" });
  }
});

app.put("/rutas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { completada } = req.body;
    const rutaActualizada = await Ruta.findByIdAndUpdate(id, { completada }, { new: true });
    if (!rutaActualizada) return res.status(404).json({ error: "Ruta no encontrada" });
    res.json({ ok: true, msg: "Ruta actualizada", ruta: rutaActualizada });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando la ruta" });
  }
});

// Nuevo endpoint para actualizar el estado de un punto
app.put("/rutas/:rutaId/puntos/:puntoId", async (req, res) => {
  try {
    const { rutaId, puntoId } = req.params;
    const { estado } = req.body;
    const ruta = await Ruta.findById(rutaId);
    if (!ruta) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }
    const punto = ruta.puntos.id(puntoId);
    if (!punto) {
      return res.status(404).json({ error: "Punto no encontrado" });
    }
    punto.estado = estado;
    await ruta.save();
    res.json({ ok: true, msg: "Punto actualizado", punto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar el punto" });
  }
});

// -------------------- PLACAS --------------------
app.get("/placas", async (req, res) => {
  try {
    const placas = await Placa.find({});
    res.json(placas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo las placas" });
  }
});

// -------------------- ASIGNACIONES --------------------
app.post("/asignaciones", async (req, res) => {
  try {
    const nuevaAsignacion = new Asignacion(req.body);
    await nuevaAsignacion.save();
    res.status(201).json({ ok: true, msg: "Asignación creada", asignacion: nuevaAsignacion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando la asignación" });
  }
});

app.get("/asignaciones", async (req, res) => {
  try {
    const asignaciones = await Asignacion.find({});
    res.json(asignaciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo las asignaciones" });
  }
});

app.put("/asignaciones/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { chofer, placa, ruta, fecha, estado } = req.body;
    const asignacionActualizada = await Asignacion.findByIdAndUpdate(
      id,
      { chofer, placa, ruta, fecha, estado },
      { new: true }
    );
    if (!asignacionActualizada) return res.status(404).json({ error: "Asignación no encontrada" });
    res.json({ ok: true, msg: "Asignación actualizada", asignacion: asignacionActualizada });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando la asignación" });
  }
});

app.delete("/asignaciones/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const asignacionEliminada = await Asignacion.findByIdAndDelete(id);
    if (!asignacionEliminada) return res.status(404).json({ error: "Asignación no encontrada" });
    res.json({ ok: true, msg: "Asignación eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando la asignación" });
  }
});

// -------------------- REPORTES --------------------
app.post("/reportes", async (req, res) => {
  try {
    const nuevoReporte = new Reporte(req.body);
    await nuevoReporte.save();
    res.status(201).json({ ok: true, msg: "Reporte creado", reporte: nuevoReporte });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando el reporte" });
  }
});

app.get("/reportes", async (req, res) => {
  try {
    const reportes = await Reporte.find({});
    res.json(reportes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo los reportes" });
  }
});

app.put("/reportes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, estado } = req.body;
    const reporteActualizado = await Reporte.findByIdAndUpdate(
      id,
      { titulo, descripcion, estado },
      { new: true }
    );
    if (!reporteActualizado) return res.status(404).json({ error: "Reporte no encontrado" });
    res.json({ ok: true, msg: "Reporte actualizado", reporte: reporteActualizado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando el reporte" });
  }
});

app.delete("/reportes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const reporteEliminado = await Reporte.findByIdAndDelete(id);
    if (!reporteEliminado) return res.status(404).json({ error: "Reporte no encontrado" });
    res.json({ ok: true, msg: "Reporte eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando el reporte" });
  }
});

// -------------------- TAREAS --------------------
app.post("/tareas", async (req, res) => {
  try {
    const nuevaTarea = new Tarea(req.body);
    await nuevaTarea.save();
    res.status(201).json({ ok: true, msg: "Tarea creada", tarea: nuevaTarea });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando la tarea" });
  }
});

app.get("/tareas", async (req, res) => {
  try {
    const tareas = await Tarea.find({});
    res.json(tareas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo las tareas" });
  }
});

app.put("/tareas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, estado } = req.body;
    const tareaActualizada = await Tarea.findByIdAndUpdate(
      id,
      { titulo, descripcion, estado },
      { new: true }
    );
    if (!tareaActualizada) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json({ ok: true, msg: "Tarea actualizada", tarea: tareaActualizada });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando la tarea" });
  }
});

app.delete("/tareas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const tareaEliminada = await Tarea.findByIdAndDelete(id);
    if (!tareaEliminada) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json({ ok: true, msg: "Tarea eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando la tarea" });
  }
});

// -------------------- PUERTO DEL SERVIDOR --------------------
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});
