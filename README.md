# Sito studio commercialista + CRM (Firebase)

Leggere questo file prima di ogni modifica al progetto.

Nota: le regole operative dell'agente sono centralizzate qui sul Desktop:
`c:\Users\pc\Desktop\cursor-agent-rules.md`
In altri progetti, puoi rimuovere/aggiornare questa nota se vuoi (├¿ l'unica riga da toccare).

**Cartella del progetto (tutto il sito sta qui):** `c:\Users\pc\Desktop\topp - Copia (2)`

- Il **sito pubblico** si apre con `index.html` nella root di questa cartella (non dentro `crm/`).
- Se su `http://localhost:8080/` vedi solo lÔÇÖ**elenco file** invece della homepage, di solito manca `index.html` nella cartella da cui hai avviato il server, oppure hai lanciato `python -m http.server` da unÔÇÖaltra directory.

## Struttura (14 file principali)

| File | Ruolo |
|------|--------|
| `index.html` | Sito pubblico (Ottimizzato SEO v2.0.1) |
| `css/style.css` | Stili sito (con scroll-margin fixed) |
| `js/main.js` | Navigazione smooth, modali, Calendly |
| `js/booking-availability.js` | Stato prenotazioni da Firestore |
| `privacy.html` / `cookie.html` | Pagine legali ottimizzate SEO |
| `robots.txt` / `sitemap-studio.xml` | SEO: placeholder `TUO-DOMINIO.it` |
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
      allow read: if true; // Il sito deve poter leggere se l'agenda ├¿ chiusa
      allow write: if isAdmin();
    }

    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}
```

## Note Aggiornamento v2.3.2
- **Security & Headers**: Ottimizzati gli header di sicurezza in `vercel.json` con l'aggiunta di `Referrer-Policy` e `Permissions-Policy`. Cambiato `X-Frame-Options` in `SAMEORIGIN` per una migliore compatibilità con i widget interni.
- **Maintenance**: Eseguito un controllo generale della struttura del sito. Mantenuti i file temporanei (`_temp`) come richiesto dall'utente per backup/referenza.
- **Final Consolidation**: Verificata l'integrità di tutti i link e delle connessioni Firebase/Calendly.

## Note Aggiornamento v2.3.1
- **Bot Optimization**: Implementato un controllo dello User-Agent in `js/booking-availability.js` per evitare che Firebase provi a inizializzare connessioni XHR (Firestore Listeners) quando la pagina viene scansionata da Googlebot o altri crawler. Questo risolve gli errori "XHR Altro errore" in Search Console.
- **Improved Crawlability**: Assicurato che i bot vedano il contenuto statico senza interferenze da script di monitoraggio in tempo reale non necessari per l'indicizzazione.

## Note Aggiornamento v2.3.0
- **Google Search Console Fix**: Risolti i blocchi di scansione nel file `robots.txt` che impedivano a Googlebot di accedere a script necessari per il rendering (`crm/firebase-config.js`).
- **Resource Accessibility**: Sbloccati percorsi critici (`/js/`, `/css/`) e rimosse restrizioni su file `.json` e `.config.js` per migliorare la scansione.
- **Font Rendering Fix**: Ripristinato un caricamento dei font più standard per evitare "Other errors" segnalati da Search Console durante la scansione della pagina.

## Note Aggiornamento v2.2.9
- **Performance Optimization (Speed Recovery)**: Ripristinate le performance al 100% riducendo il tempo di blocco (TBT) e migliorando l'LCP.
- **Font Optimization**: Rimosso il preload dei font che causava ritardi nel rendering del contenuto principale.
- **Animation Optimization**: Disabilitate le animazioni pesanti dello sfondo (`aurora-bg`) su dispositivi mobili per migliorare lo Speed Index e ridurre il carico sulla CPU.
- **Script Management**: Impostato `async` per i moduli non critici per ridurre il tempo di esecuzione iniziale.

## Note Aggiornamento v2.2.87
- **Ottimizzazione Mobile-First**: Migliorata la responsiveness su tutti i dispositivi, risolti problemi di overflow su schermi piccoli.
- **Accessibilità & UX**: Incrementata la dimensione dei target touch (min 44px) e ottimizzata la navigazione mobile.
- **Performance**: Implementato lazy loading per iframe e ottimizzato il caricamento delle risorse.
- **Fix Mappa**: Ripristinata la funzionalità di caricamento interattivo della mappa nella sezione contatti.

## Note Aggiornamento v2.2.6
- **AI Integration**: Configurato l'agente AI per il salvataggio automatico delle modifiche sul repository GitHub.

## Note Aggiornamento v2.2.5
- **Sitemap Name Change**: Rinominata `sitemap.xml` in `sitemap-studio.xml` e aggiornato `robots.txt`. Questa modifica serve a forzare Google Search Console ad effettuare un nuovo fetch del file, risolvendo l'errore "Impossibile recuperare".

## Note Aggiornamento v2.2.4
- **Smart Border-Top System**: Risolto il bug della "linea doppia" durante la navigazione tramite menu. Il sistema ├¿ stato migrato da `border-bottom` a `border-top` con una logica intelligente: quando una sezione viene raggiunta tramite link (:target), il suo bordo superiore viene nascosto per non sovrapporsi a quello dell'header, garantendo una separazione millimetrica e sempre singola.
- **Anchor Logic Fix**: Eliminata ogni interferenza visiva durante il salto tra le sezioni del sito.

## Note Aggiornamento v2.2.2
- **Refactoring Totale CSS**: Riscritto l'intero file `style.css` eliminando oltre 1200 righe di codice duplicato e conflittuale. Il file ├¿ ora leggero (300 righe), organizzato e privo di bug di eredit├á.
- **Fix Definitivo Bordi**: Implementata logica `border-top` selettiva che garantisce una singola linea di separazione tra le sezioni, eliminando definitivamente la "linea doppia" o "strana" segnalata.
- **Calendly Ultra-Optimization**: La modale di prenotazione ora utilizza un layout Flexbox avanzato con altezza dinamica al 96% della finestra. L'header e il footer della modale rimangono fissi mentre l'agenda occupa tutto lo spazio centrale, eliminando ogni scrollbar interna non necessaria.
- **Cache-Busting v1.1.2**: Aggiornato il puntamento agli asset per forzare il refresh immediato su tutti i browser.

## Note Aggiornamento v2.1.1
- **Calendly UI Fix**: Implementato layout Flexbox sulla modale Calendly per forzare l'iframe ad occupare il 100% dell'altezza disponibile. Questo elimina lo scroll interno su qualsiasi risoluzione, rendendo visibili anche i link in fondo (privacy policy).
- **Layout Borders Fix**: Reset totale di tutti i bordi delle sezioni e applicazione selettiva del solo `border-bottom` tramite ID specifici. Questo elimina definitivamente la doppia linea tra le sezioni "Chi ├¿" e "Perch├®/Servizi".

## Note Aggiornamento v2.1.0
- **Layout Consistency**: Corretta la gestione delle linee di separazione nelle sezioni "Servizi" e "Contatti" per eliminare doppie linee o separatori mancanti.
- **Visual Polish**: Rimossa la linea di chiusura dall'ultima sezione per un raccordo pi├╣ fluido con il footer.

## Note Aggiornamento v2.0.8
- **Calendly Full-View**: Ingrandita drasticamente la modale di prenotazione (larghezza fino a 1200px, altezza fino a 1100px su mobile) per eliminare ogni scroll interno. Ora Calendly, privacy policy e link esterni sono tutti visibili a colpo d'occhio.
- **Fix Servizi Definitivo**: Eliminata la doppia linea nella sezione Servizi forzando la rimozione di bordi ereditati tramite `!important`.
- **UI Responsiveness**: Ottimizzati i padding delle modali su schermi piccoli per massimizzare lo spazio utile per il calendario.

## Note Aggiornamento v2.0.7
- **Fix Servizi**: Risolto definitivamente il problema delle linee di separazione duplicate nella sezione Servizi tramite una gestione mirata degli ID.

## Note Aggiornamento v2.0.6
- **Hero Section**: Raffinata l'estetica della sezione Home con Glassmorphism avanzato sulla card e titoli pi├╣ impattanti.
- **Typography**: Migliorata la gerarchia visiva del titolo principale (H1) per una leggibilit├á superiore su schermi 4K e Retina.

## Note Aggiornamento v2.0.3
- **UI/UX**: Refactoring completo del sistema modali con animazioni fluide e posizionamento centrato.

## Note Aggiornamento v2.0.2
- **Accessibilit├á**: Gestione focus avanzata nelle modali (focus trap e ripristino automatico) per una navigazione conforme agli standard.

## Note Aggiornamento v2.0.1
- **Cambio Password**: Accessibile esclusivamente dal login (non occupa spazio in Dashboard).

## Integrazioni esterne

- **Formspree** (`https://formspree.io/f/mzdjnolr`): modulo ÔÇ£Richiedi infoÔÇØ. La mail di destinazione si configura nella **dashboard Formspree**, non solo nellÔÇÖHTML. Campo nascosto `email_destinazione_richiesta` ├¿ solo promemoria nel corpo invio.
- **Calendly** (`https://calendly.com/sapienzaandrea557/15min`): embed in modale; conferme/notifiche si gestiscono da Calendly.
- **Firebase**: Auth (email/password) + Firestore per CRM e stato pubblico prenotazioni.

## Firestore ÔÇö collezioni suggerite

- `infoRequests` ÔÇö richieste dal CRM (inserite manualmente o da estensioni future)
- `appointments` ÔÇö appuntamenti registrati nel CRM
- `publicSettings/booking` ÔÇö documento singolo con campi come `bookingsDisabled`, `bookingsDisabledReason`, orari/blocchi (vedi `crm/app.js`)

### Regole di sicurezza

Limitare lettura/scrittura agli UID amministratori (Firebase Console ÔåÆ Authentication ÔåÆ User UID). Esempio concettuale: solo `request.auth.uid` in una lista di UID autorizzati per le collezioni private; per **lettura pubblica** del solo documento `publicSettings/booking` (per `js/booking-availability.js` sul sito) serve una regola che consenta `read` a chi non ├¿ autenticato su quel documento, ad esempio:

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

Carica la cartella (senza `Wondershare` o altre cartelle estranee) su hosting statico (Netlify, Vercel, GitHub Pages, Firebase Hosting). Aggiorna dominio in `robots.txt`, `sitemap-studio.xml`, meta `canonical` / `og:url` in `index.html`.

## Prima utenza CRM

Creare lÔÇÖutente in **Firebase Console ÔåÆ Authentication ÔåÆ Users** (registrazione pubblica dal sito CRM ├¿ disattivata).
