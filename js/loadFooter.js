// === Inserta el footer dinámicamente en todas las páginas ===
document.addEventListener("DOMContentLoaded", () => {
  // Crea el contenedor del footer si no existe
  if (!document.querySelector(".app-footer")) {
    const footerContainer = document.createElement("div");
    footerContainer.id = "footer-placeholder";
    document.body.appendChild(footerContainer);
  }

  // Detectar profundidad para ruta relativa
  let depth = window.location.pathname.split("/").length - 2; // cuenta carpetas
  let basePath = "../".repeat(depth);
  const footerURL = basePath + "partials/footer.html";

  fetch(footerURL)
  .then(response => {
    if (!response.ok) throw new Error("Footer no encontrado");
    return response.text();
  })
  .then(html => {
    document.getElementById("footer-placeholder").innerHTML = html;

    // Inicializa el reloj cuando el footer está listo
    if (typeof initFooterClock === "function") {
      initFooterClock();
    }
  })
  .catch(err => console.error("❌ Error cargando footer:", err));

});
