const API = "http://localhost:4000";

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (data.role === "chofer") {
    window.location = "chofer.html";
  } else if (data.role === "supervisor") {
    window.location = "supervisor.html";
  } else {
    alert("Error en login");
  }
}

async function reportar(estado) {
  await fetch(`${API}/reporte`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ choferId: "chofer123", ubicacion: { lat: -3.26, lng: -79.95 }, estado })
  });
  alert("Reporte enviado: " + estado);
}

async function verReportes() {
  const res = await fetch(`${API}/reportes`);
  const reportes = await res.json();
  document.getElementById("reportes").innerText = JSON.stringify(reportes, null, 2);
}
