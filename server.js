// -------------------- IMPORTS --------------------
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
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
  .then(() => console.log("🟢 Conectado a MongoDB Atlas"))
  .catch((err) => {
    console.error("🔴 Error al conectar a MongoDB Atlas:", err);
    process.exit(1);
  });

// -------------------- ENDPOINTS --------------------

// ➡️ Rutas de Usuarios
app.post("/login", async (req, res) => {
  try {
    const { username, password, placa } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    if (user.role === "chofer") {
      if (!placa) {
        return res.status(400).json({ error: "Placa es requerida para choferes" });
      }
      const placaAsignada = await Placa.findOne({ placa, estado: "activo" });
      if (!placaAsignada) {
        return res.status(401).json({ error: "Placa no encontrada o inactiva" });
      }
    }

    res.json({ ok: true, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.post("/check-role", async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });
    if (user) {
      res.json({ role: user.role });
    } else {
      res.status(404).json({ error: "Usuario no encontrado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo los usuarios" });
  }
});

// ➡️ Rutas de Placas
app.get("/placas", async (req, res) => {
  try {
    const placas = await Placa.find({});
    res.json(placas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo las placas" });
  }
});

app.post("/placas", async (req, res) => {
  try {
    const { placa, estado } = req.body;
    const nuevaPlaca = new Placa({ placa, estado });
    await nuevaPlaca.save();
    res.status(201).json({ ok: true, msg: "Placa creada", placa: nuevaPlaca });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando la placa" });
  }
});

// 🛑 Este es el endpoint corregido
// Nuevo endpoint para editar el estado de la placa
// 🚀 Endpoint CORREGIDO para editar una placa
app.put("/placas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Verificar si el estado recibido es válido según el enum del modelo
    if (estado && !["activo", "inactivo"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido. Debe ser 'activo' o 'inactivo'." });
    }

    const placaActualizada = await Placa.findByIdAndUpdate(
      id,
      { estado },
      { new: true, runValidators: true } // `new: true` devuelve el documento actualizado; `runValidators: true` ejecuta las validaciones del esquema
    );

    if (!placaActualizada) {
      return res.status(404).json({ error: "Placa no encontrada." });
    }
    res.json({ ok: true, msg: "Placa actualizada", placa: placaActualizada });
  } catch (err) {
    console.error("Error al actualizar la placa:", err);
    // Si la validación de Mongoose falla, capturamos el error
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor al actualizar la placa." });
  }
});

app.delete("/placas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const placaEliminada = await Placa.findByIdAndDelete(id);
    if (!placaEliminada) {
      return res.status(404).json({ error: "Placa no encontrada" });
    }
    res.json({ ok: true, msg: "Placa eliminada", placa: placaEliminada });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando la placa" });
  }
});

// ➡️ Rutas de Rutas
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
    res.json({ ok: true, msg: "Punto de ruta actualizado", punto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando el punto de ruta" });
  }
});

app.post("/rutas", async (req, res) => {
  try {
    const { nombre, puntos } = req.body;
    const nuevaRuta = new Ruta({ nombre, puntos });
    await nuevaRuta.save();
    res.status(201).json({ ok: true, msg: "Ruta creada", ruta: nuevaRuta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando la ruta" });
  }
});

// ➡️ Rutas de Tareas
app.post("/tareas", async (req, res) => {
  try {
    const { titulo, descripcion, estado } = req.body;
    const nuevaTarea = new Tarea({ titulo, descripcion, estado });
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

// ➡️ Rutas de Asignaciones
app.post("/asignaciones", async (req, res) => {
  try {
    const { placa, chofer, tarea, fecha, turno } = req.body;
    const nuevaAsignacion = new Asignacion({ placa, chofer, tarea, fecha, turno });
    await nuevaAsignacion.save();
    res.status(201).json({ ok: true, msg: "Asignación creada", asignacion: nuevaAsignacion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando la asignación" });
  }
});

app.get("/asignaciones", async (req, res) => {
  try {
    const asignaciones = await Asignacion.find({}).populate("placa").populate("chofer").populate("tarea");
    res.json(asignaciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo las asignaciones" });
  }
});

app.get("/asignaciones/:choferId", async (req, res) => {
  try {
    const { choferId } = req.params;
    const asignaciones = await Asignacion.find({ chofer: choferId })
      .populate('placa')
      .populate('tarea')
      .populate('chofer');
    res.json(asignaciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo las asignaciones del chofer" });
  }
});

// ➡️ Rutas de Reportes
app.get("/reportes", async (req, res) => {
  try {
    const reportes = await Reporte.find({})
      .populate('chofer')
      .populate('tarea');
    res.json(reportes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo los reportes" });
  }
});

app.post("/reportes", async (req, res) => {
  try {
    const { chofer, tarea, fecha, descripcion, fotoUrl, estado } = req.body;
    const nuevoReporte = new Reporte({
      chofer,
      tarea,
      fecha,
      descripcion,
      fotoUrl,
      estado
    });
    await nuevoReporte.save();
    res.status(201).json({ ok: true, msg: "Reporte creado", reporte: nuevoReporte });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando el reporte" });
  }
});

app.post("/reportes/:id/foto", async (req, res) => {
  try {
    const { id } = req.params;
    const { fotoUrl } = req.body;
    const reporte = await Reporte.findById(id);

    if (!reporte) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }

    reporte.fotoUrl = fotoUrl;
    await reporte.save();
    res.json({ ok: true, msg: "Foto actualizada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando la foto del reporte" });
  }
});

// -------------------- SERVIDOR --------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});
