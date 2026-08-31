# Vicus & Fabula — Landing page

Landing page single-page, mobile-first, per validare la stagionalità dell'escursionismo
a Caltagirone e raccogliere risposte anonime in vista del lancio del gioco
WebAR "Vicus & Fabula", premiando chi risponde con un codice sconto immediato.

Nessun framework, nessun build step: è un sito statico puro (`index.html` +
`qr-print.html`), pensato per essere aperto direttamente da un QR code fisico
affisso alla base della Scala di Santa Maria del Monte, anche con connessione
dati non ottimale.

## File

- `index.html` — landing page pubblica. Contiene anche la vista admin
  (`?admin=1`, protetta da login) con il riepilogo delle risposte raccolte.
- `qr-print.html` — strumento ad uso interno per generare l'immagine QR
  ad alta risoluzione da stampare sul cartello fisico.
- `vendor/qrcode-generator.js` — libreria di generazione QR (MIT, Kazuhiko
  Arase) inclusa localmente, senza dipendere da una CDN esterna.

## Backend: Firebase (Firestore + Authentication)

Le iscrizioni vengono scritte su **Cloud Firestore** del progetto Firebase
`vicusandfabula` (già configurato in `index.html`). Nessun server da gestire:
il piano gratuito Spark è sufficiente per questo volume di traffico.

### 1. Regole di sicurezza Firestore

Il progetto è partito in **modalità test** (lettura e scrittura pubbliche,
scadenza automatica). Prima di affiggere il cartello fisico, sostituisci le
regole in Console Firebase → Firestore Database → Regole con:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /risposte/{docId} {
      // Chiunque può inviare una risposta dal form pubblico...
      allow create: if request.resource.data.keys().hasOnly(
                        ['fasciaOraria','dataOggi','provenienza','mezzoTrasporto','source','createdAt']
                      )
                    && request.resource.data.provenienza is string
                    && request.resource.data.mezzoTrasporto is string
                    && request.resource.data.source is string;
      // ...ma solo un admin autenticato può leggere/modificare/cancellare.
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

Le risposte non includono più alcun dato personale (nessun campo email o
telefono viene raccolto): sono statistiche anonime sulla provenienza e le
abitudini dei visitatori. La lettura resta comunque riservata agli admin
per non rendere pubblicamente consultabili i numeri del progetto prima del
lancio.

### 2. Creare l'account admin

La vista `?admin=1` richiede un login Firebase Authentication:

1. Console Firebase → Authentication → Sign-in method → abilita **Email/Password**.
2. Authentication → Users → **Aggiungi utente**: inserisci l'email e una
   password che userai per accedere al pannello (es. `dotto.dottes@gmail.com`).
3. Su `index.html?admin=1`, accedi con quelle credenziali per vedere i
   conteggi aggregati (fascia oraria, provenienza, mezzo di trasporto, canale).

### 3. Configurazione già presente nel codice

`firebaseConfig` è già incollato nello script di `index.html` (progetto
`vicusandfabula`). La `apiKey` di un'app web Firebase non è un segreto da
nascondere: la vera protezione dei dati sono le regole Firestore sopra, non
l'oscurità della chiave.

## Pubblicare la landing page

Il sito è statico: può essere pubblicato con GitHub Pages (Settings → Pages →
Deploy from branch), Netlify, Vercel o qualsiasi hosting statico. Non servono
build né dipendenze da installare.

## Generare il QR per il cartello fisico

Apri `qr-print.html` (localmente o dopo il deploy), verifica/correggi l'URL
della landing page pubblicata, lascia `source=qr-scala` (o cambialo), scegli
la risoluzione di stampa e scarica il PNG.

L'URL incorporato nel QR è sempre del tipo:

```
https://tuo-dominio/index.html?source=qr-scala
```

Il parametro `source` viene salvato con ogni risposta del form, per poter
distinguere in futuro il traffico dal cartello fisico da altri canali.

## Vendita pass (Stripe Payment Links)

La sezione "Prenota il tuo pass" della landing page permette l'acquisto di
un pass di accesso al gioco. Non essendoci un backend, il pagamento è
gestito interamente da **Stripe Payment Links**: il pulsante "Acquista"
è un semplice link a una pagina di pagamento ospitata da Stripe, senza
bisogno di scrivere codice server-side né di passare al piano Blaze di
Firebase.

### 1. Creare il Payment Link

1. Accedi alla [Dashboard Stripe](https://dashboard.stripe.com/) → **Payment
   links** → **Crea un payment link**.
2. Crea il prodotto "Pass Vicus & Fabula" con il prezzo desiderato.
3. (Opzionale) In "Opzioni avanzate" attiva **"Consenti codici promozionali"**
   se vuoi che i visitatori possano inserire il codice sconto ricevuto dal
   form (es. `VICUS10`) al momento del pagamento — in tal caso crea anche il
   relativo codice promozionale in Stripe → Prodotti → Codici promozionali.
4. Copia l'URL generato (tipo `https://buy.stripe.com/xxxxxxxx`).

### 2. Collegarlo alla landing page

In `index.html`, dentro lo script, aggiorna le due costanti:

```js
var TICKET_PRICE_LABEL = "€9,90"; // testo mostrato in pagina, solo informativo
var TICKET_PAYMENT_LINK_URL = "https://buy.stripe.com/xxxxxxxx"; // il tuo Payment Link
```

`TICKET_PRICE_LABEL` è solo testo mostrato nella card: il prezzo realmente
addebitato è quello configurato nel prodotto Stripe, quindi tienili
allineati manualmente. Finché `TICKET_PAYMENT_LINK_URL` contiene ancora il
placeholder `REPLACE_WITH_YOUR_PAYMENT_LINK`, il pulsante viene mostrato
disattivato con il testo "Vendita in arrivo" (tradotto nelle 5 lingue),
così da evitare un link rotto prima che il pass sia davvero in vendita.

## Codice sconto

Il form non raccoglie email o telefono: subito dopo aver risposto al
questionario, il visitatore vede a schermo un codice sconto (con un pulsante
"copia codice") da usare al lancio di Vicus & Fabula. Non essendoci un
contatto associato, è lo stesso codice per tutti — è impostato nella
costante `DISCOUNT_CODE` dentro lo script di `index.html` e va aggiornato lì
se in futuro vuoi cambiarlo o generarne uno diverso per campagna.

## Resilienza offline

Firestore mantiene una cache locale persistente nel browser: se il
visitatore ha connessione instabile (frequente ai piedi della scalinata),
la risposta viene registrata subito e sincronizzata automaticamente non
appena la connessione torna disponibile, senza bloccare la conferma mostrata
sullo schermo.

## Lingue

La landing page pubblica è disponibile in **italiano, inglese, spagnolo,
francese e cinese**. La lingua viene scelta automaticamente in base al
browser del visitatore (con l'italiano come lingua di riserva), è
selezionabile in ogni momento dal menu in alto a destra nella hero, e la
scelta viene ricordata tra le visite successive (o forzabile con `?lang=en`
nell'URL). Le traduzioni sono nel dizionario `I18N` dentro lo script di
`index.html`: per modificare un testo va aggiornato in tutte e cinque le
lingue. Il pannello admin (`?admin=1`) resta solo in italiano, essendo uno
strumento a uso interno.

Il campo "Da dove vieni?" del form ha 3 opzioni fisse (Sicilia / Italia /
Estero), salvate su Firestore sempre con questi valori canonici in italiano
indipendentemente dalla lingua mostrata al visitatore.

## Personalizzazione

- Palette e font sono definiti nelle variabili CSS in cima a `index.html`
  (`--terracotta`, `--ocra`, `--maiolica`, `--cream`), ispirate alla
  ceramica di Caltagirone.
- Testi, campi del form e liste puntate sono modificabili direttamente
  nell'HTML, senza bisogno di build.
- Il nome della collection Firestore (`risposte`) è impostato nella
  costante `COLLECTION_NAME`, e il codice sconto nella costante
  `DISCOUNT_CODE`, entrambe dentro lo script di `index.html`.
