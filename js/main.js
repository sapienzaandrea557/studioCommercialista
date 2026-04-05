(function () {
  "use strict";

  const CLARITY_PROJECT_ID = "w1y42abzxc";

  const injectScript = ({ id, src, async = false, defer = false }) => {
    if (id && document.getElementById(id)) return;
    if (document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement("script");
    if (id) s.id = id;
    s.src = src;
    s.async = async;
    s.defer = defer;
    document.head.appendChild(s);
  };

  const scheduleIdle = (fn) => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(fn, { timeout: 2000 });
      return;
    }
    window.setTimeout(fn, 1);
  };

  const loadAnalytics = () => {
    scheduleIdle(() => {
      const host = location.hostname;
      const isLocal = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
      if (!isLocal) {
        injectScript({ id: "vercel-insights", src: "/_vercel/insights/script.js", defer: true });
        injectScript({ id: "vercel-speed-insights", src: "/_vercel/speed-insights/script.js", defer: true });
      }

      if (!window.clarity) {
        window.clarity = function () {
          (window.clarity.q = window.clarity.q || []).push(arguments);
        };
      }
      injectScript({
        id: "ms-clarity",
        src: `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`,
        async: true
      });
    });
  };

  const init = () => {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* --- Navigation & Active Link Logic --- */
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav a");

    // Optimized Active Link logic - Only run on desktop or high-perf devices
    const isMobile = window.innerWidth < 768;
    
    if ("IntersectionObserver" in window) {
      const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            navLinks.forEach(link => {
              link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
            });
          }
        });
      }, { 
        rootMargin: isMobile ? "-40% 0px -40% 0px" : "-20% 0px -70% 0px", 
        threshold: 0 
      });

      sections.forEach(section => navObserver.observe(section));
    }

    // Standard smooth scroll handling for nav links
    navLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        const targetId = link.getAttribute("href");
        if (targetId && targetId.startsWith("#")) {
          e.preventDefault();
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 80;
          const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            
            window.scrollTo({
              top: targetPos,
              behavior: 'smooth'
            });
          }

          // Mobile menu auto-close
          const nav = document.getElementById("main-nav");
          const menuToggle = document.querySelector(".menu-toggle");
          if (nav && nav.classList.contains("open")) {
            nav.classList.remove("open");
            menuToggle.classList.remove("open");
            document.body.classList.remove("menu-open");
          }
        }
      }, { passive: false });
    });

    const header = document.querySelector(".site-header");
    if (header) {
      let ticking = false;
      let lastScrollY = window.scrollY;

      const setHeaderHeightVar = () => {
        const h = header.offsetHeight;
        if (h) document.documentElement.style.setProperty("--header-height", `${h}px`);
      };

      if ("ResizeObserver" in window) {
        const ro = new ResizeObserver(() => setHeaderHeightVar());
        ro.observe(header);
      } else {
        window.addEventListener("resize", () => setHeaderHeightVar(), { passive: true });
      }

      const onScroll = () => {
        lastScrollY = window.scrollY;
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const isScrolled = lastScrollY > 40;
            if (header.classList.contains("is-scrolled") !== isScrolled) {
              header.classList.toggle("is-scrolled", isScrolled);
              setHeaderHeightVar();
            }
            ticking = false;
          });
          ticking = true;
        }
      };
      setHeaderHeightVar();
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    // Reveal animations on scroll
    if (!reduceMotion && "IntersectionObserver" in window) {
      const revealEls = document.querySelectorAll(".reveal");
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("is-visible");
              io.unobserve(en.target);
            }
          });
        },
        { rootMargin: "0px 0px -1% 0px", threshold: 0.01 }
      );
      revealEls.forEach((el) => io.observe(el));
    } else {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
    }

    /* ——— Cookie Banner ——— */
    const cookieBanner = document.getElementById("cookie-banner");
    const consent = localStorage.getItem("cookie_consent");
    if (consent === "analytics" || consent === "all") loadAnalytics();

    if (cookieBanner && !consent) {
      cookieBanner.hidden = false;
      const acceptNecessary = document.getElementById("cookie-accept-necessary");
      const acceptAnalytics = document.getElementById("cookie-accept-analytics");
      const acceptAll = document.getElementById("cookie-accept-all");

      const handleConsent = (level) => {
        localStorage.setItem("cookie_consent", level);
        cookieBanner.hidden = true;
        if (level === "analytics" || level === "all") loadAnalytics();
      };

      if (acceptNecessary) acceptNecessary.onclick = () => handleConsent("necessary");
      if (acceptAnalytics) acceptAnalytics.onclick = () => handleConsent("analytics");
      if (acceptAll) acceptAll.onclick = () => handleConsent("all");
    }

    /* ——— Mobile Menu ——— */
    const menuToggle = document.getElementById("menu-toggle");
    const mainNav = document.getElementById("main-nav");
    if (menuToggle && mainNav) {
      menuToggle.addEventListener("click", () => {
        const isOpen = mainNav.classList.toggle("open");
        menuToggle.classList.toggle("open", isOpen);
        document.body.classList.toggle("menu-open", isOpen);
      }, { passive: true });
    }

    /* ——— Map Loading ——— */
    const loadMapBtn = document.getElementById("load-map");
    const mapEmbed = document.getElementById("map-embed");
    if (loadMapBtn && mapEmbed) {
      const handleMapLoad = (e) => {
        e.preventDefault();
        loadMapBtn.style.display = "none";
        mapEmbed.hidden = false;
        mapEmbed.style.display = "block";
        mapEmbed.innerHTML = `<iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2970.366223847841!2d12.4683!3d41.8841!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x132f60473e34a655%3A0x6a0c5c3c0c0c0c0c!2sVia%20Napoleone%20Parboni%2C%2012%2C%2000153%20Roma%20RM!5e0!3m2!1sit!2sit!4v1711720000000!5m2!1sit!2sit" 
          width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
      };
      loadMapBtn.addEventListener("click", handleMapLoad);
      // Support for touch devices
      loadMapBtn.addEventListener("touchend", (e) => {
        if (!mapEmbed.innerHTML) handleMapLoad(e);
      }, { passive: false });
    }

    scheduleIdle(() => {
      document.body.classList.add("is-ready");
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Logica Modali (fuori da init per disponibilità immediata ai pulsanti)
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m._lastFocusedElement = document.activeElement;
    
    // Salva la posizione dello scroll attuale
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.body.classList.add("modal-open");
    
    m.hidden = false;
    m.setAttribute("aria-hidden", "false");
    const focusable = m.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) setTimeout(() => focusable[0].focus(), 100);
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    
    // Ripristina lo scroll
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
    
    m.hidden = true;
    m.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (m._lastFocusedElement) m._lastFocusedElement.focus();
  }

  // Rendi disponibili le funzioni a livello globale per integrazioni esterne (es. booking-availability.js)
  window.studioModals = { open: openModal, close: closeModal };

  document.querySelectorAll(".modal").forEach(m => {
    m.addEventListener("click", (e) => {
      if (e.target === m) closeModal(m.id);
    });
  });

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
        container.innerHTML = `<iframe id="calendly-iframe" src="${CALENDLY_URL}?embed_domain=${encodeURIComponent(location.origin)}&embed_type=Inline&hide_gdpr_banner=1" width="100%" height="100%" frameborder="0" loading="lazy" style="border:0;"></iframe>`;
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
