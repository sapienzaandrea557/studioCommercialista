/**
 * Legge da Firestore publicSettings/booking lo stato prenotazioni e aggiorna il sito pubblico.
 * Usa la stessa config del CRM (documento booking).
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { firebaseConfig } from "../crm/firebase-config.js";

// Googlebot/Crawler check - Evita errori XHR durante la scansione
const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);

const hasAnalyticsConsent = () => {
  try {
    const c = localStorage.getItem("cookie_consent");
    return c === "analytics" || c === "all";
  } catch {
    return false;
  }
};

// Inizializza Firebase per uso pubblico (senza auth)
const app = initializeApp(firebaseConfig, "public-booking-status");
const db = getFirestore(app);

// Funzione per recuperare l'IP pubblico dell'utente con fallback e cache
let cachedIP = null;
async function getUserIP() {
  if (cachedIP) return cachedIP;
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    cachedIP = data.ip;
    return cachedIP;
  } catch (e) {
    try {
      const response = await fetch('https://api64.ipify.org?format=json');
      const data = await response.json();
      cachedIP = data.ip;
      return cachedIP;
    } catch (e2) {
      return "IP_NOT_FOUND";
    }
  }
}

// --- Logger Visite (Logga ogni utente che entra nel sito) ---
const logVisit = async () => {
  if (isBot) return;
  if (!hasAnalyticsConsent()) return;
  try {
      const ip = await getUserIP();
      const isMobile = window.innerWidth < 900;
      
      // Invia a Firestore
      await addDoc(collection(db, "siteVisits"), {
        ipAddress: ip,
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp(),
        page: window.location.pathname,
        source: "auto_load_ultimate_v6",
        device: isMobile ? "Mobile" : "Desktop",
        isBot: isBot
      });
    } catch (e) {
    }
};

// Esponi per compatibilità se necessario (ma main.js non lo usa più)
window.studioLogVisit = logVisit;

if (!isBot) {
  // --- Gestione Richieste Info (Scrittura su Firestore per Dashboard CRM) ---
  const infoForm = document.getElementById("form-info");
  if (infoForm) {
    infoForm.addEventListener("submit", async () => {
      // Nota: main.js gestisce già preventDefault e l'invio Formspree.
      // Qui aggiungiamo solo il salvataggio in Firestore in parallelo.
      try {
        const fd = new FormData(infoForm);
        const payload = {
          nome: fd.get("nome") || "Utente dal sito",
          email: fd.get("email") || "",
          telefono: fd.get("telefono") || "",
          messaggio: fd.get("messaggio") || "",
          note: "Inviata dal sito web",
          createdAt: serverTimestamp(),
        };
        if (hasAnalyticsConsent()) payload.ipAddress = await getUserIP();
        await addDoc(collection(db, "infoRequests"), payload);
      } catch (e) {
      }
    });
  }

  // --- Gestione Appuntamenti Calendly (Capture per Dashboard CRM) ---
  window.addEventListener("message", async (e) => {
    // 1. Gestione chiusura modale dal redirect (conferma.html)
    if (e.data === "calendly_success" || e.data === "close_calendly_modal") {
      setTimeout(() => {
        if (window.studioModals && typeof window.studioModals.close === "function") {
          window.studioModals.close("modal-booking");
        } else {
          // Fallback se main.js non ha ancora esposto le funzioni
          const modal = document.getElementById("modal-booking");
          if (modal) {
            modal.hidden = true;
            modal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("modal-open");
          }
        }
      }, 3000);
      return;
    }

    // 2. Gestione evento standard di Calendly (Fallback se non c'è redirect configurato)
    if (e.data.event && e.data.event === "calendly.event_scheduled") {
      try {
        const payload = {
        // Quando Calendly conferma, il browser riceve un messaggio. 
        // Non contiene i dati privati (email/tel) ma ci dice che è successo.
          data: "Da confermare",
          ora: "Vedi Mail",
          cliente: "Nuovo Appuntamento Calendly",
          email: "Controlla email di Calendly",
          telefono: "Controlla email di Calendly",
          note: "Prenotazione rilevata dal sito. I dettagli completi sono nella mail che ti ha inviato Calendly (o nella sua Dashboard).",
          createdAt: serverTimestamp(),
          source: "calendly_event_scheduled"
        };
        if (hasAnalyticsConsent()) payload.ipAddress = await getUserIP();
        await addDoc(collection(db, "appointments"), payload);
      } catch (err) {
      }
    }
  });

  // Listener per lo stato delle prenotazioni (Firestore)
  const configDoc = doc(db, "publicSettings", "booking");
  onSnapshot(
    configDoc,
    (snapshot) => {
      if (snapshot.exists()) {
        applyBookingState(snapshot.data());
      } else {
        applyBookingState({ bookingsDisabled: false });
      }
    },
    () => {
      /* Regole Firestore: lettura pubblica può essere negata; in quel caso non bloccare il sito */
      applyBookingState({ bookingsDisabled: false });
    }
  );
}

function applyBookingState(data) {
  const disabled = !!(data && data.bookingsDisabled);
  const reason =
    (data && data.bookingsDisabledReason && String(data.bookingsDisabledReason).trim()) ||
    "Le prenotazioni online sono temporaneamente sospese. Contattaci via email o telefono.";

  const note = document.getElementById("booking-status-note");
  const btns = document.querySelectorAll("[data-open-calendly]");

  if (disabled) {
    if (note) {
      note.hidden = false;
      note.textContent = reason;
    }
    btns.forEach((b) => {
      b.setAttribute("disabled", "disabled");
      b.setAttribute("aria-disabled", "true");
      b.classList.add("is-disabled-booking");
    });
  } else {
    if (note) note.hidden = true;
    btns.forEach((b) => {
      b.removeAttribute("disabled");
      b.removeAttribute("aria-disabled");
      b.classList.remove("is-disabled-booking");
    });
  }
}
