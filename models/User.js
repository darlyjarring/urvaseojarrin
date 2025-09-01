const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
 role: { type: String, enum: ["chofer", "supervisor", "admin"], required: true }

  // 👇 nuevos campos
  cedula: { type: String, required: true },
  nombres: { type: String, required: true },
  apellidos: { type: String, required: true }
});

module.exports = mongoose.model("User", userSchema);
