// -------------------- IMPORTS --------------------
const mongoose = require('mongoose');

// -------------------- ESQUEMA DEL USUARIO --------------------
const UserSchema = new mongoose.Schema({
  cedula: {
    type: String,
    required: true,
    unique: true
  },
  nombres: {
    type: String,
    required: true
  },
  apellidos: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['chofer', 'supervisor', 'admin'],
    required: true
  }
});

// -------------------- EXPORTAR MODELO --------------------
module.exports = mongoose.model('User', UserSchema);
