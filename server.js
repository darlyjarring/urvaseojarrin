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

// Endpoint para asignar una tarea
app.post("/tareas", async (req, res) => {
  try {
    const { placa, sector, turno } = req.body;
    const ruta = await Ruta.findOne({ nombre: sector });
    if (!ruta) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }

    // Inicializa el nuevo campo con el estado 'pendiente' para cada punto de la ruta
    const estadosIniciales = ruta.puntos.map(punto => ({
      puntoId: punto._id,
      estado: "pendiente"
    }));

    const nuevaTarea = new Tarea({
      placa,
      sector,
      turno,
      rutaId: ruta._id,
      estados_detareaxelemntoderuta: estadosIniciales,
    });
    await nuevaTarea.save();

    res.status(201).json({ ok: true, msg: "Tarea asignada con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al asignar la tarea" });
  }
});

// Endpoint para obtener tareas. Ahora funciona para choferes y para el panel de administración
app.get("/tareas", async (req, res) => {
  try {
    const { placa, turno } = req.query;
    let tareas;

    // Si recibimos 'placa' y 'turno', filtramos las tareas para el chofer
    if (placa && turno) {
      tareas = await Tarea.find({ placa, turno }).populate("rutaId");
    } else {
      // Si no, devolvemos todas las tareas para el administrador
      tareas = await Tarea.find({}).populate("rutaId");
    }
    
    res.json(tareas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener las tareas" });
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

// Nuevo endpoint para actualizar el estado de un punto en la tarea
app.put("/rutas/:rutaId/puntos/:puntoId", async (req, res) => {
  try {
    const { rutaId, puntoId } = req.params;
    const { estado } = req.body;

    // Buscamos la tarea que corresponde a esta ruta
    const tarea = await Tarea.findOne({ rutaId });
    if (!tarea) {
      return res.status(404).json({ error: "Tarea no encontrada para esta ruta" });
    }

    // Encontrar el punto dentro del nuevo array 'estados_detareaxelemntoderuta'
    const puntoEnTarea = tarea.estados_detareaxelemntoderuta.find(
      (p) => p.puntoId.toString() === puntoId
    );

    if (!puntoEnTarea) {
      return res.status(404).json({ error: "Punto de tarea no encontrado" });
    }

    // Actualizamos el estado del punto de la tarea
    puntoEnTarea.estado = estado;
    await tarea.save();

    res.json({ ok: true, msg: "Estado del punto de la tarea actualizado", puntoEnTarea });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar el estado del punto" });
  }
});

// -------------------- PUERTO --------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en puerto ${PORT}`));
