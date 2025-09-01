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

// Endpoint: Verifica el rol del usuario y si es válido
app.post("/check-role", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }
    res.json({ ok: true, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Endpoint: Realiza el login final
app.post("/login", async (req, res) => {
  try {
    const { email, password, placa } = req.body;
    const user = await User.findOne({ email, password });
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
      res.json({ ok: true, message: "Login exitoso", role: user.role, nombres: user.nombres, apellidos: user.apellidos, id: user._id, placa, turno });
    } else if (user.role === "supervisor" || user.role === "admin") {
      res.json({ ok: true, message: "Login exitoso", role: user.role, nombres: user.nombres, apellidos: user.apellidos, id: user._id });
    } else {
      res.status(400).json({ error: "Rol de usuario desconocido" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Endpoint: Registrar nuevo usuario
app.post("/register", async (req, res) => {
  try {
    const { email, password, role, cedula, nombres, apellidos } = req.body;

    if (!email || !password || !role || !cedula || !nombres || !apellidos) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const newUser = new User({
      email,
      password,
      role,
      cedula,
      nombres,
      apellidos
    });

    await newUser.save();

    res.json({ ok: true, msg: "Usuario registrado con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// Endpoint: Asignar una tarea
app.post("/tareas", async (req, res) => {
  try {
    const { placa, sector, turno, fecha, userId } = req.body;
    const ruta = await Ruta.findOne({ nombre: sector });
    if (!ruta) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }
    const nuevaTarea = new Tarea({
      placa,
      sector,
      turno,
      fecha,
      rutaId: ruta._id,
      userId
    });
    await nuevaTarea.save();
    res.status(201).json({ ok: true, msg: "Tarea asignada con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al asignar la tarea" });
  }
});

// Endpoint: Obtener tareas (para chofer o admin)
app.get("/tareas", async (req, res) => {
  try {
    const { placa, turno } = req.query;
    let query = {};
    if (placa) query.placa = placa;
    if (turno) query.turno = turno;
    
    // Si no se especifica placa ni turno, se devuelven todas las tareas
    const tareas = await Tarea.find(query).populate("rutaId").lean();
    res.json(tareas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener las tareas" });
  }
});

// Endpoint: Registrar y listar placas
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

// Endpoint: Registrar un reporte
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

// Endpoint: Obtener los reportes
app.get("/reportes", async (req, res) => {
  try {
    // Corregido: Ahora se usan los campos nombres y apellidos para mostrar el nombre del chofer
    const reportes = await Reporte.find().populate('choferId', 'nombres apellidos').lean();
    const formattedReports = reportes.map(report => ({
      ...report,
      choferName: `${report.choferId.nombres} ${report.choferId.apellidos}`
    }));
    res.json(formattedReports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener los reportes" });
  }
});

// Endpoints para el supervisor
app.get("/supervisor/choferes-activos", async (req, res) => {
  try {
    const choferes = await Asignacion.find({})
      .populate("choferId", "email nombres apellidos")
      .populate("placa", "placa")
      .sort({ fecha: -1 })
      .limit(20);
    const resultado = choferes.map(c => ({
      _id: c.choferId._id,
      nombre: `${c.choferId.nombres} ${c.choferId.apellidos}`,
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
    const { nombre, puntos } = req.body;
    if (!nombre || !puntos || puntos.length === 0) {
      return res.status(400).json({ error: "Nombre y al menos un punto son requeridos" });
    }
    const nuevaRuta = new Ruta({ nombre, puntos });
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
    res.json({ ok: true, msg: "Estado del punto actualizado", punto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar el estado del punto" });
  }
});

// -------------------- PUERTO --------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en puerto ${PORT}`));
