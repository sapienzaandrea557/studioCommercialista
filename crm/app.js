import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const LS_KEY = "booking_config_v1";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- CONFIGURAZIONE NOTIFICHE BACKGROUND ---
// Registrati su https://www.emailjs.com/ per ottenere queste chiavi (Gratis 200 mail/mese)
const EMAILJS_SERVICE_ID = "service_gbjxgbo"; 
const EMAILJS_TEMPLATE_ID = "template_appt_change"; 
const EMAILJS_PUBLIC_KEY = "MVer15cdyrEML8dEI";

const TEST_EMAIL = "sapienzaandrea557@gmail.com";
const TEST_WA = "393738513104";

async function sendBackgroundNotification(cliente, email, telefono, data, ora, tipo = "confermato/spostato") {
  const targetEmail = email || TEST_EMAIL;
  const msg = `Gentile ${cliente}, il suo appuntamento è stato ${tipo} al ${data} alle ore ${ora}. Studio Sapienza.`;
  
  console.log(`Invio notifiche (${tipo}) in background a ${targetEmail}...`);

  // 1. Invio Email (EmailJS)
  if (targetEmail && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_name: cliente,
        to_email: targetEmail,
        message: msg,
        appt_date: data,
        appt_time: ora,
        status_type: tipo
      }, EMAILJS_PUBLIC_KEY);
      console.log("Email inviata con successo.");
    } catch (err) {
      console.error("Errore invio Email:", err);
    }
  }
}

/** @type {ReturnType<typeof defaultConfig>} */
let bookingState = defaultConfig();

function defaultConfig() {
  return {
    blockedWeekdays: [],
    blockedDates: [],
    blockedRanges: [],
    blockedSlotKeys: [],
    dayWorkingHours: [],
    workStart: "09:00",
    workEnd: "18:00",
    bookingsDisabled: false,
    bookingsDisabledReason: "",
  };
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const o = JSON.parse(raw);
    bookingState = { ...defaultConfig(), ...o };
  } catch (_) {}
}

function saveLocal() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(bookingState));
  } catch (_) {}
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parseTime(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

function slotKey(weekday, minutesFromMidnight) {
  return `${weekday}-${pad2(Math.floor(minutesFromMidnight / 60))}${pad2(minutesFromMidnight % 60)}`;
}

function parseSlotKey(key) {
  const i = key.indexOf("-");
  const wd = Number(key.slice(0, i));
  const rest = key.slice(i + 1);
  const hh = Number(rest.slice(0, 2));
  const mm = Number(rest.slice(2, 4));
  return { weekday: wd, minutes: hh * 60 + mm };
}

function getWorkingHoursForWeekday(d) {
  const spec = bookingState.dayWorkingHours.find((x) => x.day === d);
  if (spec) return { start: spec.start, end: spec.end };
  return { start: bookingState.workStart, end: bookingState.workEnd };
}

function getSlotTimes() {
  const start = parseTime("08:00");
  const end = parseTime("19:00");
  const out = [];
  for (let m = start; m < end; m += 30) {
    out.push(m);
  }
  return out;
}

function isOutsideDayHours(weekday, slotStartMin) {
  const { start, end } = getWorkingHoursForWeekday(weekday);
  const a = parseTime(start);
  const b = parseTime(end);
  const slotEnd = slotStartMin + 30;
  return slotStartMin < a || slotEnd > b;
}

function hydrateUi() {
  document.getElementById("booking-disabled").checked = !!bookingState.bookingsDisabled;
  document.getElementById("booking-disabled-msg").value = bookingState.bookingsDisabledReason || "";
  document.getElementById("work-hour-start").value = bookingState.workStart;
  document.getElementById("work-hour-end").value = bookingState.workEnd;
  renderWeekdayToggles();
  renderWeekAgenda();
  renderChips();
}

function renderWeekdayToggles() {
  const el = document.getElementById("weekday-toggles");
  const names = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
  el.innerHTML = "";
  for (let d = 0; d < 7; d++) {
    const lab = document.createElement("label");
    lab.className = "day-toggle " + (bookingState.blockedWeekdays.includes(d) ? "" : "is-off");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = bookingState.blockedWeekdays.includes(d);
    cb.addEventListener("change", () => {
      if (cb.checked) {
        if (!bookingState.blockedWeekdays.includes(d)) bookingState.blockedWeekdays.push(d);
      } else {
        bookingState.blockedWeekdays = bookingState.blockedWeekdays.filter((x) => x !== d);
      }
      lab.classList.toggle("is-off", !cb.checked);
      renderWeekAgenda();
      saveLocal();
    });
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(" " + names[d]));
    el.appendChild(lab);
  }
}

function renderWeekAgenda() {
  const header = document.getElementById("agenda-header");
  const wrap = document.getElementById("week-agenda");
  const days = [1, 2, 3, 4, 5];
  const dayNames = ["", "Lun", "Mar", "Mer", "Gio", "Ven"];
  header.innerHTML = "";
  header.style.gridTemplateColumns = "52px repeat(5, minmax(80px, 1fr))";
  const corner = document.createElement("div");
  header.appendChild(corner);
  days.forEach((d) => {
    const c = document.createElement("div");
    c.textContent = dayNames[d];
    header.appendChild(c);
  });

  wrap.innerHTML = "";
  const slots = getSlotTimes();
  slots.forEach((sm) => {
    const row = document.createElement("div");
    row.className = "agenda-row";
    row.style.gridTemplateColumns = "52px repeat(5, minmax(80px, 1fr))";
    const tcell = document.createElement("div");
    tcell.className = "agenda-time";
    tcell.textContent = toHHMM(sm);
    row.appendChild(tcell);
    days.forEach((d) => {
      const cell = document.createElement("div");
      cell.className = "agenda-cell";
      const key = slotKey(d, sm);
      const fullDay = bookingState.blockedWeekdays.includes(d);
      const outside = isOutsideDayHours(d, sm);
      if (fullDay) {
        cell.classList.add("is-blocked");
      } else if (outside) {
        cell.classList.add("is-outside");
      } else if (bookingState.blockedSlotKeys.includes(key)) {
        cell.classList.add("is-blocked");
      }
      if (!fullDay && !outside) {
        cell.addEventListener("click", () => {
          const i = bookingState.blockedSlotKeys.indexOf(key);
          if (i >= 0) bookingState.blockedSlotKeys.splice(i, 1);
          else bookingState.blockedSlotKeys.push(key);
          saveLocal();
          renderWeekAgenda();
        });
      }
      row.appendChild(cell);
    });
    wrap.appendChild(row);
  });
}

function renderChips() {
  const datesEl = document.getElementById("chips-dates");
  datesEl.innerHTML = "";
  bookingState.blockedDates.forEach((d) => {
    datesEl.appendChild(chip(d, () => {
      bookingState.blockedDates = bookingState.blockedDates.filter((x) => x !== d);
      saveLocal();
      renderChips();
    }));
  });

  const rangesEl = document.getElementById("chips-ranges");
  rangesEl.innerHTML = "";
  bookingState.blockedRanges.forEach((r) => {
    const label = r.start + " → " + r.end;
    rangesEl.appendChild(chip(label, () => {
      bookingState.blockedRanges = bookingState.blockedRanges.filter(
        (x) => x.start !== r.start || x.end !== r.end
      );
      saveLocal();
      renderChips();
    }));
  });

  const dhEl = document.getElementById("chips-day-hours");
  dhEl.innerHTML = "";
  const dn = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
  bookingState.dayWorkingHours.forEach((r) => {
    const label = dn[r.day] + " " + r.start + "–" + r.end;
    dhEl.appendChild(chip(label, () => {
      bookingState.dayWorkingHours = bookingState.dayWorkingHours.filter(
        (x) => x.day !== r.day || x.start !== r.start || x.end !== r.end
      );
      saveLocal();
      hydrateUi();
    }));
  });
}

function chip(text, onRemove) {
  const span = document.createElement("span");
  span.className = "chip";
  span.appendChild(document.createTextNode(text + " "));
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip-remove";
  btn.textContent = "×";
  btn.addEventListener("click", onRemove);
  span.appendChild(btn);
  return span;
}

function getBlockedReason(dataStr, timeStr) {
  const dt = new Date(dataStr + "T" + timeStr);
  const wd = dt.getDay();
  if (bookingState.blockedWeekdays.includes(wd)) return "Giorno chiuso";
  for (const ds of bookingState.blockedDates) {
    if (ds === dataStr) return "Data bloccata";
  }
  const tms = dt.getTime();
  for (const r of bookingState.blockedRanges) {
    const a = new Date(r.start).getTime();
    const b = new Date(r.end).getTime();
    if (tms >= a && tms <= b) return "Periodo bloccato";
  }
  const minutes = dt.getHours() * 60 + dt.getMinutes();
  const sk = slotKey(wd, minutes - (minutes % 30));
  if (bookingState.blockedSlotKeys.includes(sk)) return "Fascia bloccata in agenda";
  if (isOutsideDayHours(wd, minutes)) return "Fuori orario lavorativo";
  return "";
}

function mergeFirestoreIntoState(data) {
  if (!data) return;
  bookingState = {
    ...defaultConfig(),
    ...bookingState,
    bookingsDisabled: !!data.bookingsDisabled,
    bookingsDisabledReason: data.bookingsDisabledReason || "",
    blockedWeekdays: data.blockedWeekdays || bookingState.blockedWeekdays,
    blockedDates: data.blockedDates || bookingState.blockedDates,
    blockedRanges: data.blockedRanges || bookingState.blockedRanges,
    blockedSlotKeys: data.blockedSlotKeys || bookingState.blockedSlotKeys,
    dayWorkingHours: data.dayWorkingHours || bookingState.dayWorkingHours,
    workStart: data.workStart || bookingState.workStart,
    workEnd: data.workEnd || bookingState.workEnd,
  };
}

async function saveBookingDoc() {
  bookingState.bookingsDisabled = document.getElementById("booking-disabled").checked;
  bookingState.bookingsDisabledReason = document.getElementById("booking-disabled-msg").value.trim();
  bookingState.workStart = document.getElementById("work-hour-start").value;
  bookingState.workEnd = document.getElementById("work-hour-end").value;
  saveLocal();
  const ref = doc(db, "publicSettings", "booking");
  await setDoc(ref, { ...bookingState, updatedAt: serverTimestamp() }, { merge: true });
}

function bindConfigUi() {
  document.getElementById("btn-add-date").addEventListener("click", () => {
    const v = document.getElementById("input-block-date").value;
    if (!v) return;
    if (!bookingState.blockedDates.includes(v)) bookingState.blockedDates.push(v);
    saveLocal();
    renderChips();
  });
  document.getElementById("btn-add-range").addEventListener("click", () => {
    const a = document.getElementById("input-range-start").value;
    const b = document.getElementById("input-range-end").value;
    if (!a || !b) return;
    bookingState.blockedRanges.push({ start: a, end: b });
    saveLocal();
    renderChips();
  });
  document.getElementById("btn-add-day-hour").addEventListener("click", () => {
    const day = Number(document.getElementById("sel-day-hour").value);
    const start = document.getElementById("day-h-start").value;
    const end = document.getElementById("day-h-end").value;
    if (!start || !end) return;
    bookingState.dayWorkingHours = bookingState.dayWorkingHours.filter((x) => x.day !== day);
    bookingState.dayWorkingHours.push({ day, start, end });
    saveLocal();
    hydrateUi();
  });
  document.getElementById("btn-reset-all-blocks").addEventListener("click", () => {
    if (!confirm("Cancellare tutti i blocchi (tranne orari generali e switch prenotazioni)?")) return;
    bookingState.blockedWeekdays = [];
    bookingState.blockedDates = [];
    bookingState.blockedRanges = [];
    bookingState.blockedSlotKeys = [];
    bookingState.dayWorkingHours = [];
    saveLocal();
    hydrateUi();
  });
  document.getElementById("cfg-save").addEventListener("click", async () => {
    const msg = document.getElementById("cfg-msg");
    try {
      await saveBookingDoc();
      msg.hidden = false;
      msg.className = "msg ok";
      msg.textContent = "Salvato su Firestore.";
    } catch (e) {
      msg.hidden = false;
      msg.className = "msg err";
      msg.textContent = "Errore salvataggio: " + (e && e.message ? e.message : String(e));
    }
  });
}

let unsubReq = null;
let unsubAppt = null;
let unsubVisits = null;

function fmtDate(ts) {
  if (!ts) return "—";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("it-IT");
  } catch {
    return "—";
  }
}

let reqList = [];
let apptList = [];

function renderUnifiedList() {
  const tbody = document.getElementById("list-unified");
  if (!tbody) return;
  tbody.innerHTML = "";

  // Unisce le due liste e le ordina per data decrescente (più recenti in alto)
  const combined = [...reqList, ...apptList].sort((a, b) => {
    const da = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const db = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return db - da;
  });

  combined.forEach((item) => {
    const tr = document.createElement("tr");
    const isAppt = !!item.typeAppt; 
    const id = item.id;
    const coll = isAppt ? "appointments" : "infoRequests";
    const source = item.source || "";
    
    // Gestione campi con nomi multipli per robustezza
    const clienteNome = item.cliente || item.nome || item.name || "—";
    const email = item.email || item.mail || "—";
    const telefono = item.telefono || item.tel || item.phone || "—";
    const msgNote = item.messaggio || item.note || item.message || "—";
    const dataAppt = item.data || "";
    const oraAppt = item.ora || "";
    const ip = item.ipAddress || item.ip || "—";

    // Escape dei caratteri speciali per l'onclick (evita bug con apici)
    const esc = (s) => s ? s.replace(/'/g, "\\'") : "";
    
    // Generazione pulsanti di risposta rapida
    const hasEmail = email && email !== "—" && !email.includes("Controlla email") && email.includes("@");
    const hasTel = telefono && telefono !== "—" && !telefono.includes("Controlla email") && telefono.replace(/\D/g,'').length >= 6;
    
    const btnMail = hasEmail ? `<a href="mailto:${email}?subject=Contatto dallo Studio Sapienza" class="btn-icon" title="Rispondi via Email">✉️</a>` : "";
    const btnWA = hasTel ? `<a href="https://wa.me/${telefono.replace(/\D/g,'')}" target="_blank" class="btn-icon" title="Contatta su WhatsApp">💬</a>` : "";
    
    const btnCopyEmail = hasEmail ? `<button type="button" class="btn-icon copy" onclick="copyToClipboard('${esc(email)}')" title="Copia email">📋</button>` : "";
    const btnCopyTel = hasTel ? `<button type="button" class="btn-icon copy" onclick="copyToClipboard('${esc(telefono)}')" title="Copia telefono">📋</button>` : "";

    // Evidenziamo se è una sincronizzazione completa o un segnaposto
    const rowClass = source === "calendly_event_scheduled" ? "row-placeholder" : "";

    tr.className = rowClass;
    tr.innerHTML = `
      <td><span class="badge ${isAppt ? 'badge-appt' : 'badge-info'}">${isAppt ? '📅 APP' : '✉️ INFO'}</span></td>
      <td class="small muted">${fmtDate(item.createdAt)}</td>
      <td class="small code">${ip}</td>
      <td class="bold">${clienteNome} ${source === "calendly_redirect" ? '<span title="Dati completi da Calendly">⚡</span>' : ''}</td>
      <td class="small">${email} ${btnCopyEmail}</td>
      <td class="small">${telefono} ${btnCopyTel}</td>
      <td class="small">${msgNote}</td>
      <td class="bold">${isAppt ? (dataAppt + ' ' + oraAppt) : '—'}</td>
      <td style="display: flex; gap: 0.35rem; align-items: center;">
        ${btnMail}
        ${btnWA}
        <div style="width: 1px; height: 16px; background: var(--border); margin: 0 0.15rem;"></div>
        ${isAppt ? `<button type="button" class="btn-icon" onclick="openEditAppt('${id}','${esc(dataAppt)}','${esc(oraAppt)}','${esc(clienteNome)}','${esc(msgNote)}','${esc(email)}','${esc(telefono)}')" title="Modifica">✏️</button>` : ''}
        <button type="button" class="btn-icon danger" onclick="deleteDocById('${coll}','${id}',${isAppt},'${esc(clienteNome)}','${esc(email)}','${esc(telefono)}','${esc(dataAppt)}','${esc(oraAppt)}')" title="Elimina">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    // Potremmo aggiungere un piccolo feedback visuale
    console.log("Copiato:", text);
  });
};

function attachLists() {
  const rq = query(collection(db, "infoRequests"), orderBy("createdAt", "desc"), limit(50));
  const aq = query(collection(db, "appointments"), orderBy("createdAt", "desc"), limit(50));
  const vq = query(collection(db, "siteVisits"), orderBy("timestamp", "desc"), limit(100));
  
  unsubReq = onSnapshot(rq, (snap) => {
    reqList = [];
    snap.forEach((d) => reqList.push({ id: d.id, ...d.data(), typeAppt: false }));
    renderUnifiedList();
  });
  
  unsubAppt = onSnapshot(aq, (snap) => {
    apptList = [];
    snap.forEach((d) => apptList.push({ id: d.id, ...d.data(), typeAppt: true }));
    renderUnifiedList();
  });

  unsubVisits = onSnapshot(vq, (snap) => {
    const tbody = document.getElementById("list-visits");
    const countEl = document.getElementById("visit-count");
    if (!tbody) return;
    
    if (countEl) countEl.textContent = `${snap.size} visite recenti (ultime 100)`;

    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; opacity:0.5;">Nessuna visita registrata</td></tr>';
      return;
    }

    // Raggruppa per IP per mostrare conteggio e storico
    const grouped = new Map();
    snap.forEach((d) => {
      const v = d.data();
      const ip = v.ipAddress || "—";
      if (!grouped.has(ip)) {
        grouped.set(ip, {
          ip: ip,
          lastVisit: v.timestamp,
          page: v.page || "/",
          device: v.device,
          isBot: v.isBot,
          userAgent: v.userAgent,
          count: 0,
          history: []
        });
      }
      const item = grouped.get(ip);
      item.count++;
      item.history.push({ time: v.timestamp, page: v.page || "/" });
    });

    tbody.innerHTML = "";
    grouped.forEach((v) => {
      const tr = document.createElement("tr");
      const deviceClass = v.device === "Mobile" ? 'mobile' : 'desktop';
      const deviceIcon = v.device === "Mobile" ? '📱' : '💻';
      
      tr.style.cursor = "pointer";
      tr.onclick = () => showIpHistory(v.ip, v.history);

      tr.innerHTML = `
        <td class="time-cell">${fmtDate(v.lastVisit)}</td>
        <td>
          <span class="ip-badge">${v.ip}</span>
          ${v.count > 1 ? `<span class="badge" style="background: var(--gold); color: #000; font-size: 0.7rem; margin-left: 5px;">(${v.count})</span>` : ''}
        </td>
        <td class="page-cell">${v.page}</td>
        <td class="small muted">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="device-badge ${deviceClass}">${deviceIcon} ${v.device || 'N/D'}</span>
              <span style="font-size: 0.65rem; opacity: 0.6;">${v.isBot ? '🤖 Bot' : '👤 Utente'}</span>
            </div>
            <div style="font-size: 0.7rem; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${v.userAgent}">
              ${v.userAgent}
            </div>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

async function showIpHistory(ip, history) {
  const modal = document.getElementById("modal-ip-history");
  const title = document.getElementById("history-ip-title");
  const tbody = document.getElementById("list-ip-history");
  
  title.textContent = `Storico Visite: ${ip}`;
  tbody.innerHTML = "";
  
  history.forEach(h => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="small">${fmtDate(h.time)}</td>
      <td class="small">${h.page}</td>
    `;
    tbody.appendChild(tr);
  });
  
  modal.hidden = false;
  modal.style.display = "flex";
}

document.getElementById("btn-close-history")?.addEventListener("click", () => {
  const modal = document.getElementById("modal-ip-history");
  modal.hidden = true;
  modal.style.display = "none";
});

document.getElementById("btn-clear-visits")?.addEventListener("click", async () => {
  if (!confirm("Sei sicuro di voler eliminare TUTTI i log delle visite? Questa azione non è reversibile.")) return;
  
  try {
    const q = query(collection(db, "siteVisits"), limit(100));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    alert("Log visite svuotato (ultime 100 voci).");
  } catch (ex) {
    alert("Errore durante il reset: " + ex.message);
  }
});

// --- GESTIONE MODALI ---

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.hidden = true;
    modal.style.display = "none";
  }
}

// Variabili per gestire la cancellazione con modale custom
let deleteContext = null;

// Espone funzioni globali per i bottoni in riga
window.deleteDocById = (coll, id, isAppt = false, cliente = "", email = "", telefono = "", data = "", ora = "") => {
  deleteContext = { coll, id, isAppt, cliente, email, telefono, data, ora };
  
  const modal = document.getElementById("modal-delete-confirm");
  const text = document.getElementById("delete-confirm-text");
  const btnWA = document.getElementById("btn-do-delete-wa");

  if (text) text.textContent = `Sei sicuro di voler eliminare ${cliente || 'questa voce'}?`;
  
  // Mostra il bottone WhatsApp solo se c'è un telefono
  const hasTel = telefono && telefono !== "—" && !telefono.includes("Controlla email");
  if (btnWA) btnWA.style.display = hasTel ? "flex" : "none";

  if (modal) {
    modal.hidden = false;
    modal.style.display = "flex";
  }
};

document.getElementById("btn-cancel-delete")?.addEventListener("click", () => {
  closeModal("modal-delete-confirm");
  deleteContext = null;
});

// Funzione comune per l'eliminazione effettiva
async function executeDeletion(waNotify) {
  if (!deleteContext) return;
  const { coll, id, isAppt, cliente, email, telefono, data, ora } = deleteContext;
  
  // Chiudi modale subito
  closeModal("modal-delete-confirm");

  try {
    await deleteDoc(doc(db, coll, id));

    // Se è un appuntamento o richiesta info, invia notifica di annullamento via Email (Auto)
    // Nota: sendBackgroundNotification gestisce internamente se l'email è presente
    await sendBackgroundNotification(cliente, email, telefono, data, ora, "ELIMINATO/ANNULLATO");
    
    // Se richiesto, invia anche WhatsApp
    if (waNotify && (telefono || TEST_WA)) {
      const targetWA = (telefono && telefono !== "—") ? telefono.replace(/\D/g,'') : TEST_WA;
      const msgWA = `Gentile ${cliente}, la sua richiesta/appuntamento dello Studio Sapienza è stata ANNULLATA. Cordiali saluti.`;
      window.open(`https://wa.me/${targetWA}?text=${encodeURIComponent(msgWA)}`, "_blank");
    }
  } catch (e) {
    alert("Errore durante l'eliminazione: " + e.message);
  }
}

document.getElementById("btn-do-delete")?.addEventListener("click", () => executeDeletion(false));
document.getElementById("btn-do-delete-wa")?.addEventListener("click", () => executeDeletion(true));

window.openEditAppt = (id, data, ora, cliente, note, email, telefono) => {
  const fields = {
    "edit-appt-id": id,
    "edit-appt-data": data || "",
    "edit-appt-ora": ora || "",
    "edit-appt-cliente": cliente || "",
    "edit-appt-email": email || "",
    "edit-appt-telefono": telefono || "",
    "edit-appt-note": note || ""
  };
  
  for (const [id, val] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  const modal = document.getElementById("modal-edit-appt");
  if (modal) {
    modal.hidden = false;
    modal.style.display = "flex";
  }
};

document.getElementById("btn-close-edit")?.addEventListener("click", () => {
  closeModal("modal-edit-appt");
});

document.getElementById("form-edit-appointment")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("edit-appt-id")?.value;
  const data = document.getElementById("edit-appt-data")?.value;
  const ora = document.getElementById("edit-appt-ora")?.value;
  const cliente = document.getElementById("edit-appt-cliente")?.value;
  const email = document.getElementById("edit-appt-email")?.value;
  const telefono = document.getElementById("edit-appt-telefono")?.value;
  const note = document.getElementById("edit-appt-note")?.value;

  try {
    await updateDoc(doc(db, "appointments", id), {
      data,
      ora,
      cliente,
      email,
      telefono,
      note,
      updatedAt: serverTimestamp(),
    });
    
    // 1. Invio in Background (Email/SMS se configurati)
    await sendBackgroundNotification(cliente, email, telefono, data, ora);

    // 2. Notifica WhatsApp (Manuale come fallback/opzionale)
    const msgWA = `Gentile ${cliente}, il suo appuntamento è stato spostato al ${data} alle ore ${ora}. Cordiali saluti, Studio Sapienza.`;
    const action = confirm("Modifica salvata!\n\nVuoi inviare ANCHE un messaggio WhatsApp manuale?");
    if (action) {
      const waUrl = `https://wa.me/${telefono.replace(/\D/g, "")}?text=${encodeURIComponent(msgWA)}`;
      window.open(waUrl, "_blank");
    }
    closeModal("modal-edit-appt");
  } catch (e) {
    console.error("Errore aggiornamento:", e);
    alert("Errore durante l'aggiornamento: " + e.message);
  }
});

window.deleteAppt = async (id, cliente, data, ora, telefono) => {
  if (!confirm(`Eliminare appuntamento di ${cliente} del ${data}?`)) return;
  try {
    await deleteDoc(doc(db, "appointments", id));
    
    // Notifica opzionale per cancellazione
    const msgWA = `Gentile ${cliente}, la informiamo che l'appuntamento del ${data} alle ${ora} è stato annullato. Cordiali saluti, Studio Sapienza.`;
    if (telefono && confirm("Appuntamento eliminato. Vuoi inviare una notifica WhatsApp di cancellazione?")) {
      const waUrl = `https://wa.me/${telefono.replace(/\D/g, "")}?text=${encodeURIComponent(msgWA)}`;
      window.open(waUrl, "_blank");
    }
  } catch (e) {
    alert("Errore eliminazione: " + e.message);
  }
};

function detachLists() {
  if (unsubReq) {
    unsubReq();
    unsubReq = null;
  }
  if (unsubAppt) {
    unsubAppt();
    unsubAppt = null;
  }
  if (unsubVisits) {
    unsubVisits();
    unsubVisits = null;
  }
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = document.getElementById("login-error");
  err.hidden = true;
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (ex) {
    err.hidden = false;
    if (ex.code === "auth/invalid-credential" || ex.code === "auth/user-not-found" || ex.code === "auth/wrong-password") {
      err.textContent = "Email o password non corretti.";
    } else if (ex.code === "auth/too-many-requests") {
      err.textContent = "Troppi tentativi falliti. Riprova più tardi.";
    } else {
      err.textContent = "Errore di accesso: " + (ex.message || "riprova più tardi.");
    }
  }
});

document.getElementById("btn-show-pw-change").addEventListener("click", () => {
  document.getElementById("login-form").hidden = true;
  document.getElementById("change-password-form-login").hidden = false;
});

document.getElementById("btn-forgot-password").addEventListener("click", () => {
  document.getElementById("login-form").hidden = true;
  document.getElementById("forgot-password-form").hidden = false;
});

document.getElementById("btn-back-from-forgot").addEventListener("click", () => {
  document.getElementById("login-form").hidden = false;
  document.getElementById("forgot-password-form").hidden = true;
});

document.getElementById("forgot-password-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("forgot-msg");
  const email = document.getElementById("forgot-email").value.trim();
  msg.hidden = false;
  msg.className = "msg info";
  msg.textContent = "Invio in corso...";

  try {
    await sendPasswordResetEmail(auth, email);
    msg.className = "msg ok";
    msg.textContent = "Email di recupero inviata! Controlla la tua posta.";
    setTimeout(() => {
      document.getElementById("btn-back-from-forgot").click();
      msg.hidden = true;
    }, 3000);
  } catch (ex) {
    msg.className = "msg err";
    if (ex.code === "auth/user-not-found") {
      msg.textContent = "Nessun utente trovato con questa email.";
    } else {
      msg.textContent = "Errore: " + (ex.message || "riprova più tardi.");
    }
  }
});

document.getElementById("btn-back-to-login").addEventListener("click", () => {
  document.getElementById("login-form").hidden = false;
  document.getElementById("change-password-form-login").hidden = true;
});

document.getElementById("change-password-form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("pw-msg-login");
  msg.hidden = true;
  const email = document.getElementById("pw-email-login").value.trim();
  const cur = document.getElementById("pw-current-login").value;
  const n1 = document.getElementById("pw-new-login").value;
  const n2 = document.getElementById("pw-new2-login").value;

  if (n1 !== n2) {
    msg.hidden = false;
    msg.className = "msg err";
    msg.textContent = "Le nuove password non coincidono.";
    return;
  }
  if (n1.length < 6) {
    msg.hidden = false;
    msg.className = "msg err";
    msg.textContent = "Password troppo corta (min 6).";
    return;
  }

  try {
    // 1. Autentica l'utente con la password attuale
    const userCredential = await signInWithEmailAndPassword(auth, email, cur);
    const user = userCredential.user;
    
    // 2. Aggiorna la password
    await updatePassword(user, n1);
    
    msg.hidden = false;
    msg.className = "msg ok";
    msg.textContent = "Password aggiornata! Accesso in corso...";
    
    // Il login è già avvenuto con signInWithEmailAndPassword, 
    // l'onAuthStateChanged gestirà il passaggio alla dashboard.
  } catch (ex) {
    msg.hidden = false;
    msg.className = "msg err";
    if (ex.code === "auth/wrong-password" || ex.code === "auth/invalid-credential") {
      msg.textContent = "Email o password attuale non corretti.";
    } else {
      msg.textContent = "Errore: " + (ex.message || "riprova più tardi.");
    }
  }
});

document.getElementById("btn-logout").addEventListener("click", () => signOut(auth));

document.getElementById("form-new-request").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  await addDoc(collection(db, "infoRequests"), {
    nome: fd.get("nome"),
    email: fd.get("email") || "",
    telefono: fd.get("telefono") || "",
    messaggio: fd.get("note") || "",
    note: "Inserita manualmente dal CRM",
    createdAt: serverTimestamp(),
  });
  e.target.reset();
});

document.getElementById("form-new-appointment").addEventListener("submit", async (e) => {
  e.preventDefault();
  const warn = document.getElementById("appt-warn");
  warn.hidden = true;
  const fd = new FormData(e.target);
  const data = fd.get("data");
  const ora = fd.get("ora");
  const reason = getBlockedReason(data, ora);
  if (reason) {
    warn.hidden = false;
    warn.textContent = "Blocco agenda: " + reason;
    return;
  }
  try {
    await addDoc(collection(db, "appointments"), {
      data,
      ora,
      cliente: fd.get("cliente") || "",
      email: fd.get("email") || "",
      telefono: fd.get("telefono") || "",
      note: fd.get("note") || "",
      createdAt: serverTimestamp(),
    });
    e.target.reset();
  } catch (ex) {
    warn.hidden = false;
    warn.textContent = "Errore salvataggio: " + ex.message;
  }
});

loadLocal();
bindConfigUi();

onAuthStateChanged(auth, async (user) => {
  const authPanel = document.getElementById("auth-panel");
  const mainPanel = document.getElementById("main-panel");
  const userInfo = document.getElementById("crm-user-info");
  
  if (user) {
    authPanel.style.display = "none";
    mainPanel.style.display = "block";
    authPanel.hidden = true;
    mainPanel.hidden = false;
    
    if (userInfo) {
      userInfo.textContent = `Loggato come: ${user.email}`;
    }
    
    detachLists();
    attachLists();
    try {
      const ref = doc(db, "publicSettings", "booking");
      const snap = await getDoc(ref);
      if (snap.exists()) mergeFirestoreIntoState(snap.data());
    } catch (_) {}
    hydrateUi();
  } else {
    authPanel.style.display = "block";
    mainPanel.style.display = "none";
    authPanel.hidden = false;
    mainPanel.hidden = true;
    
    if (userInfo) userInfo.textContent = "";

    // Reset forms to login view
    document.getElementById("login-form").hidden = false;
    document.getElementById("change-password-form-login").hidden = true;
    detachLists();
    hydrateUi();
  }
});
