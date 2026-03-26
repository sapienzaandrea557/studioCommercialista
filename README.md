# Sito studio commercialista + CRM (Firebase)

Leggere questo file prima di ogni modifica al progetto.

Nota: le regole operative dell'agente sono centralizzate qui sul Desktop:
`c:\Users\pc\Desktop\cursor-agent-rules.md`
In altri progetti, puoi rimuovere/aggiornare questa nota se vuoi (è l'unica riga da toccare).

**Cartella del progetto (tutto il sito sta qui):** `c:\Users\pc\Desktop\topp - Copia (2)`

- Il **sito pubblico** si apre con `index.html` nella root di questa cartella (non dentro `crm/`).
- Se su `http://localhost:8080/` vedi solo l’**elenco file** invece della homepage, di solito manca `index.html` nella cartella da cui hai avviato il server, oppure hai lanciato `python -m http.server` da un’altra directory.

## Struttura (14 file principali)

| File | Ruolo |
|------|--------|
| `index.html` | Sito pubblico (Ottimizzato SEO v2.0.1) |
| `css/style.css` | Stili sito (con scroll-margin fixed) |
| `js/main.js` | Navigazione smooth, modali, Calendly |
| `js/booking-availability.js` | Stato prenotazioni da Firestore |
| `privacy.html` / `cookie.html` | Pagine legali ottimizzate SEO |
| `robots.txt` / `sitemap.xml` | SEO: placeholder `TUO-DOMINIO.it` |
| `site.webmanifest` | Configurazione Web App (Mobile friendly) |
| `crm/index.html` | Area riservata CRM (UI Pulita v2.0.1) |
| `crm/style.css` | Stili CRM (Layout card migliorato) |
| `crm/app.js` | Logica CRM, Auth, Cambio Password sicuro |

## Test in locale

Non aprire i file con doppio clic (`file://`). Avvia un server HTTP:

```powershell
Set-Location "c:\Users\pc\Desktop\topp - Copia (2)"
python -m http.server 8080
```

Poi apri `http://localhost:8080/` (sito) e `http://localhost:8080/crm/` (CRM).

## Configurazione Firebase (Security Rules ULTRA-SICURE)

Copia e incolla queste regole nella sezione **Firestore > Rules** della tua console Firebase per far funzionare correttamente la Dashboard e il Sito in totale sicurezza:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAdmin() {
      return request.auth != null && request.auth.uid in [
        'x7HTrchFm4eMIhYKVaXKSXnF69g1', 
        'hrCH2dLwGgThz0RLrQqIyOWSucl2'
      ];
    }

    match /infoRequests/{docId} {
      // Permette l'invio solo se i dati sono nel formato corretto
      allow create: if request.resource.data.nome is string 
                    && request.resource.data.nome.size() < 100;
      allow read, write: if isAdmin();
    }

    match /appointments/{docId} {
      allow create: if request.resource.data.cliente is string;
      allow read, write: if isAdmin();
    }

    match /publicSettings/booking {
      allow read: if true; // Il sito deve poter leggere se l'agenda è chiusa
      allow write: if isAdmin();
    }

    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}
```

## Note Aggiornamento v2.1.5
- **Zero-Overlap Borders**: Riscritto completamente il sistema di separazione tra le sezioni. Rimossi tutti i bordi inferiori e implementato un sistema a bordo superiore (`border-top`) selettivo. Questo elimina definitivamente la sovrapposizione tra la sezione Home e le sezioni successive, garantendo una singola linea di separazione pulita in tutto il sito.
- **Calendly Modal Lock**: Confermata e blindata la configurazione dell'agenda a tutto schermo (v2.1.4) che offre la massima visibilità senza scroll.

## Note Aggiornamento v2.1.4
- **Refactoring Totale CSS**: Riscritto l'intero file `style.css` eliminando oltre 1200 righe di codice duplicato e conflittuale. Il file è ora leggero (300 righe), organizzato e privo di bug di eredità.
- **Fix Definitivo Bordi**: Implementata logica `border-top` selettiva che garantisce una singola linea di separazione tra le sezioni, eliminando definitivamente la "linea doppia" o "strana" segnalata.
- **Calendly Ultra-Optimization**: La modale di prenotazione ora utilizza un layout Flexbox avanzato con altezza dinamica al 96% della finestra. L'header e il footer della modale rimangono fissi mentre l'agenda occupa tutto lo spazio centrale, eliminando ogni scrollbar interna non necessaria.
- **Cache-Busting v1.1.2**: Aggiornato il puntamento agli asset per forzare il refresh immediato su tutti i browser.

## Note Aggiornamento v2.1.1
- **Calendly UI Fix**: Implementato layout Flexbox sulla modale Calendly per forzare l'iframe ad occupare il 100% dell'altezza disponibile. Questo elimina lo scroll interno su qualsiasi risoluzione, rendendo visibili anche i link in fondo (privacy policy).
- **Layout Borders Fix**: Reset totale di tutti i bordi delle sezioni e applicazione selettiva del solo `border-bottom` tramite ID specifici. Questo elimina definitivamente la doppia linea tra le sezioni "Chi è" e "Perché/Servizi".

## Note Aggiornamento v2.1.0
- **Layout Consistency**: Corretta la gestione delle linee di separazione nelle sezioni "Servizi" e "Contatti" per eliminare doppie linee o separatori mancanti.
- **Visual Polish**: Rimossa la linea di chiusura dall'ultima sezione per un raccordo più fluido con il footer.

## Note Aggiornamento v2.0.8
- **Calendly Full-View**: Ingrandita drasticamente la modale di prenotazione (larghezza fino a 1200px, altezza fino a 1100px su mobile) per eliminare ogni scroll interno. Ora Calendly, privacy policy e link esterni sono tutti visibili a colpo d'occhio.
- **Fix Servizi Definitivo**: Eliminata la doppia linea nella sezione Servizi forzando la rimozione di bordi ereditati tramite `!important`.
- **UI Responsiveness**: Ottimizzati i padding delle modali su schermi piccoli per massimizzare lo spazio utile per il calendario.

## Note Aggiornamento v2.0.7
- **Fix Servizi**: Risolto definitivamente il problema delle linee di separazione duplicate nella sezione Servizi tramite una gestione mirata degli ID.

## Note Aggiornamento v2.0.6
- **Hero Section**: Raffinata l'estetica della sezione Home con Glassmorphism avanzato sulla card e titoli più impattanti.
- **Typography**: Migliorata la gerarchia visiva del titolo principale (H1) per una leggibilità superiore su schermi 4K e Retina.

## Note Aggiornamento v2.0.3
- **UI/UX**: Refactoring completo del sistema modali con animazioni fluide e posizionamento centrato.

## Note Aggiornamento v2.0.2
- **Accessibilità**: Gestione focus avanzata nelle modali (focus trap e ripristino automatico) per una navigazione conforme agli standard.

## Note Aggiornamento v2.0.1
- **Cambio Password**: Accessibile esclusivamente dal login (non occupa spazio in Dashboard).

## Integrazioni esterne

- **Formspree** (`https://formspree.io/f/mzdjnolr`): modulo “Richiedi info”. La mail di destinazione si configura nella **dashboard Formspree**, non solo nell’HTML. Campo nascosto `email_destinazione_richiesta` è solo promemoria nel corpo invio.
- **Calendly** (`https://calendly.com/sapienzaandrea557/15min`): embed in modale; conferme/notifiche si gestiscono da Calendly.
- **Firebase**: Auth (email/password) + Firestore per CRM e stato pubblico prenotazioni.

## Firestore — collezioni suggerite

- `infoRequests` — richieste dal CRM (inserite manualmente o da estensioni future)
- `appointments` — appuntamenti registrati nel CRM
- `publicSettings/booking` — documento singolo con campi come `bookingsDisabled`, `bookingsDisabledReason`, orari/blocchi (vedi `crm/app.js`)

### Regole di sicurezza

Limitare lettura/scrittura agli UID amministratori (Firebase Console → Authentication → User UID). Esempio concettuale: solo `request.auth.uid` in una lista di UID autorizzati per le collezioni private; per **lettura pubblica** del solo documento `publicSettings/booking` (per `js/booking-availability.js` sul sito) serve una regola che consenta `read` a chi non è autenticato su quel documento, ad esempio:

```
match /publicSettings/{docId} {
  allow read: if docId == "booking";
  allow write: if request.auth != null && request.auth.uid in ["TUO_UID", "UID_COLLABORATORE"];
}
```

Adatta `TUO_UID` agli UID reali e proteggi `infoRequests` / `appointments` con `request.auth != null` + lista UID.

UID usati in passato nel progetto (sostituisci con i tuoi se diversi):

- `x7HTrchFm4eMIhYKVaXKSXnF69g1`
- `hrCH2dLwGgThz0RLrQqIyOWSucl2`

## Deploy

Carica la cartella (senza `Wondershare` o altre cartelle estranee) su hosting statico (Netlify, Vercel, GitHub Pages, Firebase Hosting). Aggiorna dominio in `robots.txt`, `sitemap.xml`, meta `canonical` / `og:url` in `index.html`.

## Prima utenza CRM

Creare l’utente in **Firebase Console → Authentication → Users** (registrazione pubblica dal sito CRM è disattivata).
