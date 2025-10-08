// typewriter.js — robusto y con cursor que desaparece al final
(() => {
  function initTypewriter() {
    const els = document.querySelectorAll('.typewriter');

    els.forEach(el => {
      const fullText = (el.getAttribute('data-text') || el.textContent || '').trim();
      el.textContent = '';

      // cursor controlado por JS (no por ::after)
      const cursor = document.createElement('span');
      cursor.className = 'tw-cursor';
      cursor.textContent = '▌';
      el.appendChild(cursor);

      let i = 0;
      (function type() {
        if (i < fullText.length) {
          el.insertBefore(document.createTextNode(fullText.charAt(i)), cursor);
          i++;
          const delay = 15 + Math.random() * 40;
          setTimeout(type, delay);
        } else {
          // al terminar, desvanecer y quitar cursor
          cursor.classList.add('fade-out');
          setTimeout(() => cursor.remove(), 500);
        }
      })();
    });
  }

  // Ejecuta aunque el DOM ya esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTypewriter);
  } else {
    initTypewriter();
  }
})();
