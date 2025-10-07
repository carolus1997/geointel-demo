// === INTRO ANIMADA CON EFECTO TYPEWRITER ===
document.addEventListener('DOMContentLoaded', () => {
    const intro = document.getElementById('intro-screen');
    const introText = document.querySelector('.intro-text');
  
    // Si la intro ya se vio, saltarla
    if (sessionStorage.getItem('introSeen')) {
      if (intro) intro.remove();
      return;
    }
  
    // Marcar la intro como vista para esta sesión
    sessionStorage.setItem('introSeen', 'true');
  
    // === EFECTO DE ESCRITURA ===
    const text = 'Initializing Tactical Interface...';
    introText.textContent = ''; // limpiar texto inicial
    let index = 0;
  
    function typeLetter() {
      if (index < text.length) {
        introText.textContent += text[index];
        index++;
        const delay = Math.random() * 60 + 20; // velocidad ligeramente irregular
        setTimeout(typeLetter, delay);
      }
    }
  
    // Iniciar escritura con un pequeño retardo para sincronizar con el fade-in
    setTimeout(typeLetter, 800);
  
    // === DESVANECER INTRO DESPUÉS ===
    setTimeout(() => {
      intro.style.opacity = '0';
      setTimeout(() => intro.remove(), 1500);
    }, 4800);
  });
  