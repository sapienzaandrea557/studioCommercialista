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

const app = initializeApp(firebaseConfig, "public-booking-status");
const db = getFirestore(app);

// --- Gestione Richieste Info (Scrittura su Firestore per Dashboard CRM) ---
const infoForm = document.getElementById("form-info");
if (infoForm) {
  infoForm.addEventListener("submit", async () => {
    // Nota: main.js gestisce già preventDefault e l'invio Formspree.
    // Qui aggiungiamo solo il salvataggio in Firestore in parallelo.
    try {
      const fd = new FormData(infoForm);
      await addDoc(collection(db, "infoRequests"), {
        nome: fd.get("nome") || "Utente dal sito",
        email: fd.get("email") || "",
        telefono: fd.get("telefono") || "",
        messaggio: fd.get("messaggio") || "",
        note: "Inviata dal sito web",
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Errore salvataggio CRM:", e);
    }
  });
}

// --- Gestione Appuntamenti Calendly (Capture per Dashboard CRM) ---
window.addEventListener("message", async (e) => {
  // 1. Gestione chiusura modale dal redirect (conferma.html)
  if (e.data === "calendly_success" || e.data === "close_calendly_modal") {
    const modal = document.getElementById("modal-booking");
    if (modal) {
      setTimeout(() => {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
      }, 3000);
    }
    return;
  }

  // 2. Gestione evento standard di Calendly (Fallback se non c'è redirect configurato)
  if (e.data.event && e.data.event === "calendly.event_scheduled") {
    try {
      // Quando Calendly conferma, il browser riceve un messaggio. 
      // Non contiene i dati privati (email/tel) ma ci dice che è successo.
      await addDoc(collection(db, "appointments"), {
        data: "Da confermare",
        ora: "Vedi Mail",
        cliente: "Nuovo Appuntamento Calendly",
        email: "Controlla email di Calendly",
        telefono: "Controlla email di Calendly",
        note: "Prenotazione rilevata dal sito. I dettagli completi sono nella mail che ti ha inviato Calendly (o nella sua Dashboard).",
        createdAt: serverTimestamp(),
        source: "calendly_event_scheduled"
      });
    } catch (err) {
      console.error("Errore capture Calendly:", err);
    }
  }
});

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

const ref = doc(db, "publicSettings", "booking");
onSnapshot(
  ref,
  (snap) => {
    if (!snap.exists()) {
      applyBookingState({ bookingsDisabled: false });
      return;
    }
    const d = snap.data();
    applyBookingState(d);
  },
  () => {
    /* Regole Firestore: lettura pubblica può essere negata; in quel caso non bloccare il sito */
    applyBookingState({ bookingsDisabled: false });
  }
);
