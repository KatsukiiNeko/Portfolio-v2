function initSkills() {
  document.querySelectorAll('.skill-bar').forEach(bar => {
    if (!bar.querySelector('span')) {
      bar.innerHTML = `<span>${bar.textContent}</span>`;
    }
  });
}
