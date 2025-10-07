// === CARGA AUTOMÁTICA DEL FOOTER CON RELOJ ===
document.addEventListener("DOMContentLoaded", () => {
    fetch("partials/footer.html")
      .then(res => res.text())
      .then(html => {
        document.body.insertAdjacentHTML("beforeend", html);
        initFooterClock(); // activa el reloj una vez insertado
      })
      .catch(err => console.error("Error al cargar el footer:", err));
  });
  