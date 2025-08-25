const API = "https://urvaseo-backend.onrender.com";

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const placa = document.getElementById("placa").value;

  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, placa })
  });

  const data = await res.json();
  if (!data.ok) {
    alert(data.error);
    return;
  }
  if (data.role === "chofer") {
    localStorage.setItem("choferId", data.id);
    localStorage.setItem("chofer", data.nombre);
    localStorage.setItem("placa", data.placa);
    localStorage.setItem("turno", data.turno);
    window.location = "chofer.html";
  } else if (data.role === "supervisor") {
    window.location = "supervisor.html";
  } else if (data.role === "admin") {
    window.location = "admin.html";
  }
}
