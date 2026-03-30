/* =========================================================
   PremierCo — main.js
   All interactive behaviours: navbar, scroll reveal,
   counter animation, portfolio filter, form handling
   ========================================================= */

(function () {
  'use strict';

  /* ── Navbar scroll behaviour ──────────────────────────── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  /* ── Mobile nav ───────────────────────────────────────── */
  const hamburger    = document.getElementById('hamburger');
  const mobileNav    = document.getElementById('mobileNav');
  const mobileClose  = document.getElementById('mobileNavClose');

  function openMobileNav() {
    mobileNav.classList.add('open');
    hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    mobileNav.classList.remove('open');
    if (hamburger) hamburger.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (hamburger) hamburger.addEventListener('click', openMobileNav);
  if (mobileClose) mobileClose.addEventListener('click', closeMobileNav);

  // close on link click
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });
  }

  /* ── Scroll reveal ────────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );

  revealEls.forEach(el => revealObserver.observe(el));

  /* ── Animated counters ────────────────────────────────── */
  function animateCounter(el) {
    const target = parseInt(el.dataset.target || '0', 10);
    const suffix = el.querySelector('span') ? el.querySelector('span').textContent : '';
    const duration = 1800;
    const step = Math.ceil(duration / target);
    let current = 0;

    const timer = setInterval(() => {
      current += Math.max(1, Math.floor(target / 60));
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.childNodes[0].textContent = current;
    }, step);
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll('.stat-number[data-target]').forEach(el => {
    counterObserver.observe(el);
  });

  /* ── Portfolio filter ─────────────────────────────────── */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioCards = document.querySelectorAll('.portfolio-card[data-category]');

  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;

        portfolioCards.forEach(card => {
          if (filter === 'all' || card.dataset.category === filter) {
            card.style.display = '';
            // re-trigger animation
            card.classList.remove('visible');
            setTimeout(() => card.classList.add('visible'), 50);
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  /* ── Contact form ─────────────────────────────────────── */
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const submitBtn   = document.getElementById('submitBtn');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Basic validation highlight
      let valid = true;
      contactForm.querySelectorAll('[required]').forEach(field => {
        if (!field.value.trim()) {
          field.style.borderColor = '#ef4444';
          valid = false;
        } else {
          field.style.borderColor = '';
        }
      });

      if (!valid) return;

      // Simulate submission
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

      setTimeout(() => {
        contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Message <i class="fas fa-paper-plane"></i>';
        if (formSuccess) {
          formSuccess.style.display = 'block';
          setTimeout(() => { formSuccess.style.display = 'none'; }, 6000);
        }
      }, 1500);
    });

    // Clear error state on focus
    contactForm.querySelectorAll('input, textarea, select').forEach(field => {
      field.addEventListener('focus', () => {
        field.style.borderColor = '';
      });
    });
  }

  /* ── Smooth scroll for anchor links ──────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = navbar ? navbar.offsetHeight + 20 : 80;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── Service card 3D tilt effect ─────────────────────── */
  document.querySelectorAll('.service-card, .mv-card, .team-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ── Active nav link highlight ────────────────────────── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });

})();
