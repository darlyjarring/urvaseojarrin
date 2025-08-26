// -------------------- IMPORTS --------------------
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
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
  .catch(err => {
    console.error("❌ Error de conexión:", err);
    process.exit(1);
  });

// -------------------- ENDPOINTS --------------------

// Endpoint 1: Verifica el rol del usuario y si es válido
app.post("/check-role", async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }
    res.json({ ok: true, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Endpoint 2: Realiza el login final
app.post("/login", async (req, res) => {
  try {
    const { username, password, placa } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    if (user.role === "chofer") {
      if (!placa) return res.status(400).json({ error: "Debe indicar la placa asignada" });
      
      const hora = new Date().getHours();
      let turno;
      if (hora >= 7 && hora < 15) turno = "07:00-15:00";
      else if (hora >= 15 && hora < 23) turno = "15:00-23:00";
      else turno = "23:00-07:00";
      
      const asignacion = new Asignacion({ choferId: user._id, placa, turno });
      await asignacion.save();
      res.json({ ok: true, message: "Login exitoso", role: user.role, nombre: user.username, id: user._id, placa, turno });
    } else if (user.role === "supervisor" || user.role === "admin") {
      res.json({ ok: true, message: "Login exitoso", role: user.role, nombre: user.username, id: user._id });
    } else {
      res.status(400).json({ error: "Rol de usuario desconocido" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Registrar nuevo usuario
app.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: "Faltan datos" });
    }
    const newUser = new User({ username, password, role });
    await newUser.save();
    res.json({ ok: true, msg: "Usuario registrado con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// Asignar y listar tareas
app.post("/tareas", async (req, res) => {
  try {
    const { placa, sector, turno, ubicacion } = req.body;
    if (!placa || !sector || !turno) {
      return res.status(400).json({ error: "Campos obligatorios" });
    }
    const tarea = new Tarea({ placa, sector, turno, ubicacion, estado: "pendiente" });
    await tarea.save();
    res.json({ ok: true, msg: "Tarea asignada ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error asignando tarea" });
  }
});

app.get("/tareas", async (req, res) => {
  try {
    const { placa, turno } = req.query;
    let query = {};
    if (placa) query.placa = placa;
    if (turno) query.turno = turno;
    const tareas = await Tarea.find(query);
    res.json(tareas);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo tareas" });
  }
});

// Registrar y listar placas
app.post("/placas", async (req, res) => {
  try {
    const { placa, activo } = req.body;
    const nuevaPlaca = new Placa({ placa, activo });
    await nuevaPlaca.save();
    res.json({ ok: true, msg: "Vehículo registrado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error registrando la placa" });
  }
});

app.get("/placas", async (req, res) => {
  try {
    const placas = await Placa.find({ activo: true });
    res.json(placas);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo placas" });
  }
});

app.put("/placas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    const placaActualizada = await Placa.findByIdAndUpdate(id, { activo }, { new: true });
    if (!placaActualizada) return res.status(404).json({ error: "Placa no encontrada" });
    res.json({ ok: true, msg: "Estado de la placa actualizado", placa: placaActualizada });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando la placa" });
  }
});

// Reporte de chofer (un solo endpoint para actualizar estado y reportar)
app.post("/reporte", async (req, res) => {
  try {
    const { id, estado, situacion, observacion } = req.body;
    const tarea = await Tarea.findByIdAndUpdate(id, { estado, situacion, observacion }, { new: true });
    if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json({ ok: true, msg: "Estado de tarea y reporte actualizados", tarea });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar la tarea" });
  }
});

// Endpoints para el supervisor
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

app.get("/supervisor/tareas/:choferId", async (req, res) => {
  try {
    const { choferId } = req.params;
    const asignacion = await Asignacion.findOne({ choferId }).sort({ fecha: -1 });
    if (!asignacion) {
      return res.status(404).json({ error: "No se encontró una asignación para este chofer" });
    }
    const { placa, turno } = asignacion;
    const tareas = await Tarea.find({ placa, turno });
    res.json(tareas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo las tareas del chofer" });
  }
});

// Endpoints para gestión de rutas
app.post("/rutas", async (req, res) => {
  try {
    const { nombre, puntos, supervisorId, choferId } = req.body;
    if (!nombre || !puntos || puntos.length === 0) {
      return res.status(400).json({ error: "Nombre y al menos un punto son requeridos" });
    }
    const nuevaRuta = new Ruta({ nombre, puntos, supervisorId, choferId });
    await nuevaRuta.save();
    res.json({ ok: true, msg: "Ruta registrada con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar la ruta" });
  }
});

app.get("/rutas", async (req, res) => {
  try {
    const rutas = await Ruta.find();
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

// 💡 Nuevo endpoint para actualizar el estado de un punto
app.put("/rutas/:rutaId/puntos/:puntoId", async (req, res) => {
  try {
    const { rutaId, puntoId } = req.params;
    const { estado } = req.body;

    // Buscamos la ruta y el punto dentro de ella
    const ruta = await Ruta.findById(rutaId);
    if (!ruta) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }

    const punto = ruta.puntos.id(puntoId);
    if (!punto) {
      return res.status(404).json({ error: "Punto no encontrado" });
    }

    // Actualizamos el estado del punto
    punto.estado = estado;
    await ruta.save();

    res.json({ ok: true, msg: "Estado del punto actualizado", punto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar el estado del punto" });
  }
});

// ... (código anterior)

// -------------------- ENDPOINTS --------------------

// Endpoint para el login
app.post("/login", async (req, res) => {
  try {
    const { username, password, placa } = req.body;
    const user = await User.findOne({ username, password });

    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });
    if (user.role === "chofer" && !placa) {
      return res.status(400).json({ error: "Debe indicar la placa asignada" });
    }

    // Detectar turno según hora actual
    const hora = new Date().getHours();
    let turno;
    if (hora >= 7 && hora < 15) turno = "07:00-15:00";
    else if (hora >= 15 && hora < 23) turno = "15:00-23:00";
    else turno = "23:00-07:00";

    // Registrar asignación del chofer a la placa
    const asignacion = new Asignacion({ choferId: user._id, placa, turno });
    await asignacion.save();

    res.json({
      role: user.role,
      choferId: user._id,
      turno,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el login" });
  }
});

// Endpoint para asignar una tarea
app.post("/tareas", async (req, res) => {
  try {
    const { placa, sector, turno } = req.body;
    const ruta = await Ruta.findOne({ nombre: sector });
    if (!ruta) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }

    const nuevaTarea = new Tarea({
      placa,
      sector,
      turno,
      rutaId: ruta._id,
    });
    await nuevaTarea.save();

    res.status(201).json({ ok: true, msg: "Tarea asignada con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al asignar la tarea" });
  }
});

// Endpoint para obtener tareas por placa y turno para el chofer
app.get("/tareas", async (req, res) => {
  try {
    const { placa, turno } = req.query;
    if (!placa || !turno) {
      return res.status(400).json({ error: "Placa y turno son requeridos" });
    }
    const tareas = await Tarea.find({ placa, turno }).populate("rutaId");
    res.json(tareas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener las tareas" });
  }
});

// Endpoint para obtener los reportes
app.get("/reportes", async (req, res) => {
  try {
    const reportes = await Reporte.find().populate('choferId', 'username').lean();
    res.json(reportes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener los reportes" });
  }
});

// Endpoint para registrar un reporte
app.post("/reporte", async (req, res) => {
  try {
    const { choferId, placa, novedad, descripcion, ubicacion } = req.body;
    const nuevoReporte = new Reporte({
      choferId,
      placa,
      novedad,
      descripcion,
      ubicacion,
    });
    await nuevoReporte.save();
    res.status(201).json({ ok: true, msg: "Reporte enviado con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al enviar el reporte" });
  }
});

// ... (resto de endpoints)

// -------------------- PUERTO --------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en puerto ${PORT}`));
