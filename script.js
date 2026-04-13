/* ========================================================================
   Acoustic Orange by Christian Hamilton - JavaScript
   ======================================================================== */

/* --- Form Endpoint Configuration ---
 *
 * Set the URL below to connect the consultation form to a backend.
 *
 * Supported free services:
 *   Formspree   - "https://formspree.io/f/YOUR_FORM_ID"
 *   Basin       - "https://usebasin.com/f/YOUR_FORM_ID"
 *   Web3Forms   - "https://api.web3forms.com/submit" (add access_key field)
 *   Netlify     - add netlify attribute to <form>, leave FORM_ENDPOINT blank
 *   Webhook     - any POST endpoint that accepts JSON
 *
 * When FORM_ENDPOINT is empty the form runs in demo mode:
 * it simulates a successful submission so you can test the UI.
 * -------------------------------------------------------------------- */
const FORM_ENDPOINT = '';

/* --- DOM Ready --- */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollReveal();
  initForm();
});

/* =====================================================================
   Navigation
   ===================================================================== */
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  const overlay = document.querySelector('.nav-overlay');
  const root = document.documentElement;
  let lockedScrollY = 0;

  if (!toggle || !links) return;

  links.setAttribute('aria-hidden', 'true');

  function openMenu() {
    lockedScrollY = window.scrollY;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    links.classList.add('is-open');
    links.setAttribute('aria-hidden', 'false');
    if (overlay) {
      overlay.classList.add('is-visible');
      overlay.setAttribute('aria-hidden', 'false');
    }
    root.classList.add('nav-open');
    document.body.classList.add('nav-open');
    document.body.style.top = `-${lockedScrollY}px`;
  }

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menu');
    links.classList.remove('is-open');
    links.setAttribute('aria-hidden', 'true');
    if (overlay) {
      overlay.classList.remove('is-visible');
      overlay.setAttribute('aria-hidden', 'true');
    }
    root.classList.remove('nav-open');
    document.body.classList.remove('nav-open');
    document.body.style.top = '';
    window.scrollTo(0, lockedScrollY);
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  /* Close on Escape key */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      toggle.focus();
    }
  });

  /* Close when clicking a nav link (mobile) */
  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      if (window.innerWidth <= 860) closeMenu();
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 860 && toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    }
  });
}

/* =====================================================================
   Scroll Reveal  (respects prefers-reduced-motion)
   ===================================================================== */
function initScrollReveal() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.reveal');

  if (prefersReduced || !items.length) {
    /* Show everything immediately when reduced motion is preferred */
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((el) => observer.observe(el));
}

/* =====================================================================
   Form Handling
   ===================================================================== */
function initForm() {
  const form = document.getElementById('consultation-form');
  if (!form) return;

  form.addEventListener('submit', handleSubmit);

  /* Live validation: clear errors on input */
  form.querySelectorAll('input, textarea').forEach((field) => {
    field.addEventListener('input', () => {
      const group = field.closest('.form-group');
      if (group) group.classList.remove('has-error');
    });
  });
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;

  if (!validateForm(form)) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Sending\u2026';
  submitBtn.disabled = true;

  try {
    if (FORM_ENDPOINT) {
      /* Production: POST to configured endpoint */
      const data = new FormData(form);
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new Error('Submission failed');
    } else {
      /* Demo mode: simulate network delay */
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    showSuccess(form);
  } catch (err) {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    /* Show a brief inline error */
    const errorEl = document.createElement('p');
    errorEl.className = 'body-sm';
    errorEl.style.color = 'var(--error)';
    errorEl.style.marginTop = 'var(--space-sm)';
    errorEl.textContent = 'Something went wrong. Please try again or schedule directly via Calendly.';
    form.querySelector('.form-submit-row').appendChild(errorEl);
    setTimeout(() => errorEl.remove(), 5000);
  }
}

function validateForm(form) {
  let valid = true;

  const name = form.querySelector('#full-name');
  const phone = form.querySelector('#phone');
  const message = form.querySelector('#message');

  /* Full Name */
  if (!name.value.trim()) {
    showFieldError(name, 'Please enter your name.');
    valid = false;
  }

  /* Phone, basic check: at least 7 digits */
  const digits = phone.value.replace(/\D/g, '');
  if (digits.length < 7) {
    showFieldError(phone, 'Please enter a valid phone number.');
    valid = false;
  }

  /* Message */
  if (!message.value.trim()) {
    showFieldError(message, 'Please share something so we know how to start.');
    valid = false;
  }

  return valid;
}

function showFieldError(field, msg) {
  const group = field.closest('.form-group');
  if (!group) return;
  group.classList.add('has-error');
  const errorEl = group.querySelector('.field-error');
  if (errorEl) errorEl.textContent = msg;
  field.focus();
}

function showSuccess(form) {
  form.style.display = 'none';
  const success = document.querySelector('.form-success');
  if (success) success.classList.add('is-visible');
}
