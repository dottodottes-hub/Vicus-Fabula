# Vicus & Fabula — Landing page

Landing page single-page, mobile-first, per validare la stagionalità dell'escursionismo
a Caltagirone e costruire la waitlist di lancio del gioco WebAR "Vicus & Fabula".

Nessun framework, nessun build step: è un sito statico puro (`index.html` +
`qr-print.html`), pensato per essere aperto direttamente da un QR code fisico
affisso alla base della Scala di Santa Maria del Monte, anche con connessione
dati non ottimale.

## File

- `index.html` — landing page pubblica. Contiene anche la vista admin
  (`?admin=1`) con il riepilogo delle risposte raccolte.
- `qr-print.html` — strumento ad uso interno per generare l'immagine QR
  ad alta risoluzione da stampare sul cartello fisico.
- `apps-script/Code.gs` — backend leggero (Google Apps Script + Google Sheet)
  che riceve le iscrizioni e restituisce le statistiche aggregate.

## 1. Configurare il backend (Google Apps Script)

Non c'è alcun server da gestire: si usa Google Apps Script collegato a un
Google Sheet, gratuito.

1. Crea un nuovo Google Sheet vuoto (Google Drive → Nuovo → Fogli Google).
2. Estensioni → Apps Script.
3. Sostituisci il contenuto di `Code.gs` con quello di
   [`apps-script/Code.gs`](apps-script/Code.gs) di questo repo.
4. Deploy → Nuova implementazione → tipo **Applicazione web**:
   - Esegui come: **Me**
   - Chi ha accesso: **Chiunque**
5. Copia l'URL generato (termina con `/exec`).
6. Apri `index.html`, cerca `CONFIG.APPS_SCRIPT_URL` (in fondo al file, nel
   tag `<script>`) e incolla lì l'URL copiato.

Il foglio "Risposte" viene creato automaticamente al primo invio del form.

## 2. Pubblicare la landing page

Il sito è statico: può essere pubblicato con GitHub Pages (Settings → Pages →
Deploy from branch), Netlify, Vercel o qualsiasi hosting statico. Non servono
build né dipendenze da installare.

## 3. Generare il QR per il cartello fisico

Apri `qr-print.html` (localmente o dopo il deploy), verifica/correggi l'URL
della landing page pubblicata, lascia `source=qr-scala` (o cambialo), scegli
la risoluzione di stampa e scarica il PNG.

L'URL incorporato nel QR è sempre del tipo:

```
https://tuo-dominio/index.html?source=qr-scala
```

Il parametro `source` viene salvato con ogni risposta del form, per poter
distinguere in futuro il traffico dal cartello fisico da altri canali.

## 4. Consultare i dati raccolti

Vai su `https://tuo-dominio/index.html?admin=1` per la vista riepilogativa:
conteggio totale delle risposte, breakdown per fascia oraria, provenienza,
mezzo di trasporto e canale, e numero di contatti raccolti per la waitlist.

## Resilienza offline

Se il visitatore ha connessione instabile (frequente ai piedi della
scalinata), la risposta viene comunque salvata in una coda locale nel
browser e reinviata automaticamente al backend appena la connessione torna
disponibile o l'endpoint viene raggiunto, così nessuna risposta va persa.

## Personalizzazione

- Palette e font sono definiti nelle variabili CSS in cima a `index.html`
  (`--terracotta`, `--ocra`, `--maiolica`, `--cream`), ispirate alla
  ceramica di Caltagirone.
- Testi, campi del form e liste puntate sono modificabili direttamente
  nell'HTML, senza bisogno di build.
