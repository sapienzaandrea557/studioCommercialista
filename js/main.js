(function () {
  "use strict";

  const init = () => {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // Scroll fluido semplificato
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        const id = this.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "auto", block: "start" });
        }
      });
    });

    const header = document.querySelector(".site-header");
    if (header) {
      const onScroll = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 20);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* ——— Mobile Menu ——— */
    const menuToggle = document.getElementById("menu-toggle");
    const mainNav = document.getElementById("main-nav");
    if (menuToggle && mainNav) {
      menuToggle.addEventListener("click", () => {
        const isOpen = mainNav.classList.toggle("open");
        menuToggle.classList.toggle("open", isOpen);
        document.body.classList.toggle("menu-open", isOpen);
      });
    }
  };

  // Caricamento ultra-differito
  if (document.readyState === "complete") {
    setTimeout(init, 500);
  } else {
    window.addEventListener("load", () => setTimeout(init, 500));
  }

  // Logica Modali (fuori da init per disponibilità immediata ai pulsanti)
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m._lastFocusedElement = document.activeElement;
    m.hidden = false;
    m.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";
    const focusable = m.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) setTimeout(() => focusable[0].focus(), 100);
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = true;
    m.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    if (m._lastFocusedElement) m._lastFocusedElement.focus();
  }

  document.querySelectorAll("[data-open-modal]").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.getAttribute("data-open-modal")));
  });

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.getAttribute("data-close-modal")));
  });

  // Logica Calendly
  const CALENDLY_URL = "https://calendly.com/sapienzaandrea557/15min";
  document.querySelectorAll("[data-open-calendly]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openModal("modal-booking");
      const container = document.getElementById("calendly-container");
      if (container && !container.innerHTML) {
        container.innerHTML = `<iframe id="calendly-iframe" src="${CALENDLY_URL}?embed_domain=${encodeURIComponent(location.origin)}&embed_type=Inline&hide_gdpr_banner=1" width="100%" height="100%" frameborder="0"></iframe>`;
      }
    });
  });

  // Gestione Formspree (Contatti)
  const infoForm = document.getElementById("form-info");
  if (infoForm) {
    infoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("form-info-message");
      const submitBtn = infoForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = "Invio...";
        const res = await fetch(infoForm.action, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(infoForm)))
        });
        if (res.ok) {
          msg.textContent = "Messaggio inviato con successo!";
          msg.hidden = false;
          infoForm.reset();
        } else {
          throw new Error();
        }
      } catch (err) {
        msg.textContent = "Errore nell'invio. Riprova più tardi.";
        msg.hidden = false;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
})();
