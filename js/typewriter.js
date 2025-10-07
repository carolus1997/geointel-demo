// === EFECTO TYPEWRITER TÁCTICO ===
// Selecciona todos los elementos que tengan la clase .typewriter
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.typewriter');
    
    elements.forEach(el => {
      const text = el.textContent.trim();
      el.textContent = '';
      let index = 0;
  
      function type() {
        if (index < text.length) {
          el.textContent += text[index];
          index++;
          const delay = Math.random() * 40 + 15; // velocidad variable para naturalidad
          setTimeout(type, delay);
        }
      }
  
      // Pequeño retardo antes de comenzar
      setTimeout(type, Math.random() * 800 + 200);
    });
  });
  