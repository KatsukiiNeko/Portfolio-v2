function initContact() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: 'CYnilZhs-1QRVzITw1' });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd   = new FormData(form);
    const data = Object.fromEntries(fd);

    if (typeof emailjs !== 'undefined') {
      emailjs
        .sendForm('service_pz2fdyu', 'template_uvhng6k', form)
        .then(() => showFormSuccess(form, data.name))
        .catch(err => {
          console.error('EmailJS error:', err);
          alert('Failed to send. Please try again later.');
        });
    } else {
      showFormSuccess(form, data.name);
    }
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showFormSuccess(form, name) {
  const safeName = name ? ', ' + escapeHtml(name) : '';
  form.innerHTML = `
    <div class="form-success">
      <i class="fas fa-check-circle"></i>
      <h3>Message Sent!</h3>
      <p>Thank you${safeName}. I'll get back to you soon!</p>
    </div>`;
}
