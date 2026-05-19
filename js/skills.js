function initSkills() {
  document.querySelectorAll('.skill-item').forEach(item => {
    const percent = item.dataset.percent;
    item.style.setProperty('--skill-percent', percent + '%');
  });
}
