
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://urvaseo_user:KDLjar-*90@cluster0.mongodb.net/urvaseo?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  password: String,
  rol: String
});
const Usuario = mongoose.model('Usuario', userSchema);

const actividadSchema = new mongoose.Schema({
  chofer: String,
  lat: Number,
  lng: Number,
  estado: String,
  zona: String,
  timestamp: { type: Date, default: Date.now }
});
const Actividad = mongoose.model('Actividad', actividadSchema);

app.post('/registro', async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = new Usuario({ nombre, email, password: hash, rol });
  await user.save();
  res.json({ message: 'Usuario registrado' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await Usuario.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ message: 'Contraseña incorrecta' });
  const token = jwt.sign({ id: user._id, rol: user.rol, nombre: user.nombre }, 'secret', { expiresIn: '8h' });
  res.json({ token, rol: user.rol, nombre: user.nombre });
});

const auth = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'No autorizado' });
  try {
    const data = jwt.verify(token, 'secret');
    req.user = data;
    next();
  } catch (err) { return res.status(401).json({ message: 'Token inválido' }); }
};

app.post('/actividad', auth, async (req, res) => {
  const { lat, lng, estado, zona } = req.body;
  const actividad = new Actividad({ chofer: req.user.nombre, lat, lng, estado, zona });
  await actividad.save();
  if (estado === 'Robo' || estado === 'Daño' || estado === 'No cumplida') {
    io.emit('incidente', { chofer: req.user.nombre, estado, lat, lng });
  }
  res.json({ message: 'Actividad registrada' });
});

app.get('/actividades', auth, async (req, res) => {
  if (req.user.rol !== 'Supervisor') return res.status(403).json({ message: 'Acceso denegado' });
  const actividades = await Actividad.find();
  res.json(actividades);
});

app.get('/indicadores', auth, async (req, res) => {
  const total = await Actividad.countDocuments();
  const cumplidas = await Actividad.countDocuments({ estado: 'Recolectando' });
  const robos = await Actividad.countDocuments({ estado: 'Robo' });
  const daños = await Actividad.countDocuments({ estado: 'Daño' });
  const noCumplidas = await Actividad.countDocuments({ estado: 'No cumplida' });
  res.json({ total, cumplidas, robos, daños, noCumplidas });
});

server.listen(3000, () => console.log('Servidor corriendo en puerto 3000'));
