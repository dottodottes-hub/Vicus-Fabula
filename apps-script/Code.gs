/**
 * Vicus & Fabula — backend leggero per il form della landing page.
 *
 * Deploy:
 * 1. Crea un nuovo Google Sheet (vuoto).
 * 2. Estensioni > Apps Script, incolla questo file al posto di Code.gs.
 * 3. Deploy > Nuova implementazione > Tipo "Applicazione web".
 *    - Esegui come: Me
 *    - Chi ha accesso: Chiunque
 * 4. Copia l'URL generato (finisce con /exec) e incollalo in
 *    CONFIG.APPS_SCRIPT_URL dentro index.html.
 *
 * Il foglio "Risposte" viene creato automaticamente al primo invio.
 */

var SHEET_NAME = 'Risposte';

function doPost(e) {
  var sheet = getSheet_();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.fasciaOraria || '',
    data.dataOggi || '',
    data.provenienza || '',
    data.mezzoTrasporto || '',
    data.contatto || '',
    data.source || ''
  ]);
  return jsonResponse_({ ok: true });
}

function doGet(e) {
  var action = e.parameter.action;
  if (action === 'stats') {
    return jsonResponse_(computeStats_());
  }
  return jsonResponse_({ ok: true, message: 'Vicus & Fabula API attiva' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Fascia oraria', 'Data visita', 'Provenienza', 'Mezzo trasporto', 'Contatto', 'Source']);
  }
  return sheet;
}

function computeStats_() {
  var sheet = getSheet_();
  var values = sheet.getDataRange().getValues();
  var rows = values.slice(1); // salta l'intestazione

  var stats = {
    totale: rows.length,
    fasciaOraria: {},
    provenienza: {},
    mezzoTrasporto: {},
    source: {},
    conContatto: 0
  };

  rows.forEach(function (r) {
    incr_(stats.fasciaOraria, r[1]);
    incr_(stats.provenienza, r[3]);
    incr_(stats.mezzoTrasporto, r[4]);
    incr_(stats.source, r[6]);
    if (r[5]) stats.conContatto++;
  });

  return stats;
}

function incr_(obj, key) {
  var k = key || 'non specificato';
  obj[k] = (obj[k] || 0) + 1;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
