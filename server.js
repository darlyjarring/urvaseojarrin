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
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch(err => {
    console.error("❌ Error de conexión a MongoDB Atlas", err);
    process.exit(1);
  });

// -------------------- ENDPOINTS --------------------

// Endpoint de login y roles
app.post("/login", async (req, res) => {
  const { username, password, placa } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    }

    let isMatch = false;
    // Comprueba si la contraseña de la base de datos ya está hasheada
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Si la contraseña no está hasheada, realiza una comparación simple (para usuarios antiguos)
      isMatch = password === user.password;
      // Si el inicio de sesión es exitoso, hashea y actualiza la contraseña inmediatamente
      if (isMatch) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await User.findByIdAndUpdate(user._id, { password: hashedPassword });
        console.log(`✅ Contraseña del usuario '${username}' hasheada y actualizada.`);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ ok: false, msg: "Contraseña incorrecta" });
    }

    if (user.role === "chofer" && !placa) {
      return res.status(400).json({ ok: false, msg: "La placa es obligatoria para los choferes" });
    }

    res.json({ ok: true, role: user.role, placa: placa });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error en el servidor" });
  }
});

// Endpoint para verificar el rol
app.post("/check-role", async (req, res) => {
  const { username } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    }
    res.json({ ok: true, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error en el servidor" });
  }
});

// Endpoint para crear usuarios
app.post("/register", async (req, res) => {
  try {
    // Se agregaron los campos adicionales que envía tu formulario
    const { cedula, nombres, apellidos, username, password, role } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      cedula,
      nombres,
      apellidos,
      username,
      password: hashedPassword,
      role,
    });
    await newUser.save();
    res.status(201).json({ ok: true, msg: "Usuario creado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error creando usuario" });
  }
});

// Endpoint para obtener usuarios
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo los usuarios" });
  }
});

// Endpoint para crear placas
app.post("/placas", async (req, res) => {
  try {
    const { placa, estado } = req.body;
    const nuevaPlaca = new Placa({
      placa,
      estado,
    });
    await nuevaPlaca.save();
    res.status(201).json({ ok: true, msg: "Placa creada", placa: nuevaPlaca });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando la placa" });
  }
});

// Endpoint para obtener placas
app.get("/placas", async (req, res) => {
  try {
    const placas = await Placa.find({});
    res.json(placas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo las placas" });
  }
});

// Endpoint para actualizar el estado de una placa
// Actualizar estado de placa (CORREGIDO)
app.put("/placas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    if (estado !== "activo" && estado !== "inactivo") {
      return res.status(400).json({ error: "Estado inválido. Debe ser 'activo' o 'inactivo'." });
    }
    const placaActualizada = await Placa.findByIdAndUpdate(id, { estado }, { new: true });
    if (!placaActualizada) return res.status(404).json({ error: "Placa no encontrada" });
    res.json({ ok: true, msg: "Placa actualizada", placa: placaActualizada });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando la placa" });
  }
});

// Endpoint para obtener placas activas
app.get("/placas-activas", async (req, res) => {
  try {
    const placas = await Placa.find({ estado: "activo" });
    res.json(placas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo las placas activas" });
  }
});

// Endpoint para crear rutas
app.post("/rutas", async (req, res) => {
  try {
    const { nombre, puntos } = req.body;
    const nuevaRuta = new Ruta({
      nombre,
      puntos,
    });
    await nuevaRuta.save();
    res.status(201).json(nuevaRuta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando la ruta" });
  }
});

// Endpoint para obtener rutas
app.get("/rutas", async (req, res) => {
  try {
    const rutas = await Ruta.find({});
    res.json(rutas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo las rutas" });
  }
});

// Endpoint para actualizar el estado de una ruta
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

// Endpoint para crear tareas
app.post("/tareas", async (req, res) => {
    try {
        const { titulo, descripcion, placa, sector, turno, rutaId, userId, fecha } = req.body;
        
        if (!placa || !sector || !turno || !rutaId) {
            return res.status(400).json({ error: "Placa, sector, turno y rutaId son obligatorios." });
        }

        const ruta = await Ruta.findById(rutaId);
        if (!ruta) {
            return res.status(404).json({ error: "Ruta no encontrada." });
        }

        const estados_detareaxelemntoderuta = ruta.puntos.map(punto => ({
            puntoId: punto._id,
            estado: "pendiente"
        }));
        
        // ✅ Corregido: Usamos la fecha que viene en el cuerpo de la solicitud (req.body)
        const nuevaTarea = new Tarea({
            placa,
            sector,
            turno,
            fecha, // <-- ¡Aquí está la corrección!
            rutaId,
            titulo,
            descripcion,
            userId,
            estados_detareaxelemntoderuta
        });
        
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

// Endpoint para crear asignaciones
app.post("/asignaciones", async (req, res) => {
  try {
    const { placa, tarea, chofer, fecha, turno } = req.body;
    const nuevaAsignacion = new Asignacion({
      placa,
      tarea,
      chofer,
      fecha,
      turno
    });
    await nuevaAsignacion.save();
    res.status(201).json({ ok: true, msg: "Asignación creada", asignacion: nuevaAsignacion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando la asignación" });
  }
});

// Endpoint para obtener asignaciones
app.get("/asignaciones", async (req, res) => {
  try {
    const asignaciones = await Asignacion.find({})
      .populate('placa')
      .populate('tarea')
      .populate('chofer');
    res.json(asignaciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo las asignaciones" });
  }
});

// Nuevo endpoint para obtener asignaciones por chofer
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

// Nuevo endpoint para obtener reportes
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

// Nuevo endpoint para crear un reporte
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

// Endpoint para obtener la tarea de un chofer por placa y turno
app.get("/tareas/chofer/:placa/:turno", async (req, res) => {
    try {
        const { placa, turno } = req.params;
        const fechaHoy = new Date().toISOString().split('T')[0]; // Obtiene la fecha de hoy en formato YYYY-MM-DD
        
        const tarea = await Tarea.findOne({
            placa,
            turno,
            fecha: { 
                $gte: new Date(fechaHoy + 'T00:00:00.000Z'),
                $lt: new Date(fechaHoy + 'T23:59:59.999Z')
            }
        }).populate({
            path: 'rutaId',
            populate: {
                path: 'puntos',
                model: 'Punto'
            }
        });

        if (!tarea) {
            return res.status(404).json({ error: "No se encontró ninguna tarea para la placa y turno de hoy." });
        }

        res.status(200).json(tarea);
    } catch (err) {
        console.error("Error al obtener la tarea del chofer:", err);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});

app.put("/tareas/:tareaId/puntos/:puntoId", async (req, res) => {
    try {
        const { tareaId, puntoId } = req.params;
        const { estado } = req.body;

        const tarea = await Tarea.findById(tareaId);
        if (!tarea) {
            return res.status(404).json({ error: "Tarea no encontrada." });
        }

        const puntoEnTarea = tarea.estados_detareaxelemntoderuta.find(p => p.puntoId.toString() === puntoId);
        if (!puntoEnTarea) {
            return res.status(404).json({ error: "Punto no encontrado en la tarea." });
        }

        puntoEnTarea.estado = estado;

        // ✅ Lógica para actualizar el estado general de la tarea
        const totalPuntos = tarea.estados_detareaxelemntoderuta.length;
        const puntosEjecutados = tarea.estados_detareaxelemntoderuta.filter(p => p.estado === 'ejecutada').length;

        if (puntosEjecutados === totalPuntos) {
            // Si todos los puntos están ejecutados, la tarea está terminada
            tarea.estado = 'terminada';
        } else if (puntosEjecutados > 0) {
            // Si hay al menos un punto ejecutado, la tarea está en proceso
            tarea.estado = 'en proceso';
        } else {
            // Si no hay puntos ejecutados, la tarea está pendiente
            tarea.estado = 'pendiente';
        }
        
        await tarea.save();

        res.status(200).json({ ok: true, msg: "Estado del punto y la tarea actualizado." });
    } catch (err) {
        console.error("Error al actualizar el estado del punto:", err);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});

// Endpoint para reportar una observación
app.post("/observaciones", async (req, res) => {
    try {
        const { chofer, tarea, punto, descripcion } = req.body;
        // Aquí puedes guardar esta observación en una nueva colección de tu base de datos si lo deseas.
        // Por ahora, solo responderemos que la novedad fue recibida con éxito.
        console.log("Nueva observación recibida:", req.body);
        res.status(201).json({ ok: true, msg: "Observación enviada con éxito." });
    } catch (err) {
        console.error("Error al recibir la observación:", err);
        res.status(500).json({ error: "Error al procesar la observación." });
    }
});
// -------------------- PUERTO --------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en puerto ${PORT}`));
