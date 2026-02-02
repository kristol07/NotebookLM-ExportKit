/*
 * Copyright (C) 2026 kristol07
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import type { MessageValue } from './types';
import { pluralize } from './helpers';

export const IT_MESSAGES: Record<string, MessageValue> = {
  'app.name': 'NotebookLM ExportKit',
  'common.account': 'Account',
  'common.signIn': 'Accedi',
  'common.signOut': 'Esci',
  'common.close': 'Chiudi',
  'common.back': 'Indietro',
  'common.upgrade': 'Upgrade',
  'common.connect': 'Connetti',
  'common.disconnect': 'Disconnetti',
  'common.changeAccount': 'Cambia account',
  'common.changeWorkspace': 'Cambia area di lavoro',
  'common.refreshList': 'Aggiorna elenco',
  'common.ready': 'Pronto',
  'common.needsSetup': 'Configurazione necessaria',
  'common.done': 'Fatto',
  'common.unlocked': 'Sbloccato',
  'common.googleDrive': 'Google Drive',
  'common.notion': 'Notion',
  'common.thisDevice': 'Questo dispositivo',
  'common.downloads': 'Download',
  'common.uploadingToDrive': 'Caricamento su Drive',
  'common.signedIn': 'Accesso effettuato',
  'common.language': 'Lingua',
  'common.settings': 'Impostazioni',
  'common.uiLanguage': 'Lingua',
  'common.email': 'Email',
  'common.orUseEmail': "oppure usa l'email",
  'common.exportDestination': 'Destinazione export',
  'common.exportToNotion': 'Esporta in Notion',
  'common.copy': 'Copia',

  'header.signOutTitle': 'Esci',

  'export.section.quiz': 'Esportazioni quiz',
  'export.section.flashcards': 'Esportazioni flashcard',
  'export.section.mindmap': 'Esportazioni mappe mentali',
  'export.section.note': 'Esportazioni note',
  'export.section.report': 'Esportazioni report',
  'export.section.chat': 'Esportazioni chat',
  'export.section.datatable': 'Esportazioni tabelle dati',
  'export.section.source': 'Esportazioni fonti',
  'export.option.clipboard': 'Appunti',
  'export.hint.notion': 'Le esportazioni su Notion usano layout nativi.',
  'export.comingSoon': 'In arrivo',
  'export.comingSoonDetail': 'Panoramiche video e audio in trascrizione/diapositive',
  'export.pdfQualityTitle': 'Qualità PDF',
  'export.pdfQualitySize': 'Dimensione prima',
  'export.pdfQualityClarity': 'Chiarezza prima',
  'export.supportedBy': ({ locale, apps }) => {
    if (!apps || typeof apps !== 'string') {
      return 'Supportato da';
    }
    return `Supportato da ${apps}`;
  },
  'export.destinationHint.drive': 'Le esportazioni su Drive richiedono una connessione Google Drive e un abbonamento Plus.',
  'export.destinationHint.notion': 'Le esportazioni su Notion richiedono una connessione Notion e un abbonamento Plus.',
  'export.destinationHint.download': 'Le esportazioni locali sono istantanee. I formati avanzati si sbloccano con Plus.',

  'export.notionLayout.quiz':
    'Domande in callout, opzioni a elenco puntato, toggle per suggerimenti/risposte, sezioni di spiegazione',
  'export.notionLayout.flashcards': 'Schede con toggle e note posteriori blu',
  'export.notionLayout.mindmap': 'Intestazioni di sezione con elenco annidato + toggle',
  'export.notionLayout.datatable': 'Tabella dati con celle di riga',
  'export.notionLayout.note': 'Documento ricco con paragrafi, tabelle e blocchi di codice',
  'export.notionLayout.report': 'Report ricco con intestazioni, paragrafi, tabelle e blocchi di codice',
  'export.notionLayout.chat': 'Intestazioni di ruolo con paragrafi, tabelle e blocchi di codice',
  'export.notionLayout.source': 'Dettaglio fonte con riepilogo, temi chiave e contenuti strutturati',

  'content.quiz': 'Quiz',
  'content.flashcards': 'Flashcard',
  'content.mindmap': 'Mappa mentale',
  'content.note': 'Nota',
  'content.report': 'Report',
  'content.chat': 'Chat',
  'content.source': 'Fonti',
  'content.datatable': 'Tabella dati',

  'drive.setup': 'Configurazione Drive',
  'drive.step.signIn': '1. Accedi al tuo account',
  'drive.step.upgrade': '2. Upgrade a Plus',
  'drive.step.connect': '3. Connetti Google Drive',
  'drive.note.subscription': 'Il tuo abbonamento resta con questo account.',
  'drive.note.plus': 'La consegna su Drive è disponibile con Plus.',
  'drive.note.connectedAs': ({ locale, email }) => `Connesso come ${email}`,
  'drive.note.chooseAccount': 'Scegli un account Google per la consegna su Drive.',

  'notion.setup': 'Configurazione Notion',
  'notion.step.signIn': '1. Accedi al tuo account',
  'notion.step.upgrade': '2. Upgrade a Plus',
  'notion.step.connect': '3. Connetti Notion',
  'notion.step.destination': '4. Scegli una pagina di destinazione',
  'notion.note.subscription': 'Il tuo abbonamento resta con questo account.',
  'notion.note.plus': 'La consegna su Notion è disponibile con Plus.',
  'notion.note.connectedTo': ({ locale, workspace }) => `Connesso a ${workspace}.`,
  'notion.note.authorizeWorkspace': "Autorizza l'area di lavoro in cui devono arrivare le esportazioni.",
  'notion.note.destinationSet': ({ locale, preview }) => `Destinazione impostata (${preview}).`,
  'notion.note.destinationPick': 'Scegli una pagina per ospitare il database NotebookLM ExportKit.',
  'notion.pages.choose': 'Scegli una pagina Notion',
  'notion.pages.none': 'Nessuna pagina trovata',
  'notion.saving': 'Salvataggio destinazione...',

  'upgrade.banner.title': 'Piano Plus',
  'upgrade.banner.note': 'Sblocca formati avanzati e consegna su Drive e Notion.',
  'upgrade.modal.title': 'Upgrade a Plus',
  'upgrade.modal.subtitle.drive': 'Abilita la consegna su Google Drive e i formati avanzati.',
  'upgrade.modal.subtitle.notion': 'Abilita la consegna su Notion e i formati avanzati.',
  'upgrade.modal.subtitle.format': 'Sblocca subito i formati di esportazione avanzati.',
  'upgrade.modal.subtitle.general': 'Sblocca formati avanzati e consegna su Drive e Notion.',
  'upgrade.modal.benefit.formats': 'Formati di esportazione avanzati per flussi di studio.',
  'upgrade.modal.benefit.drive': 'Consegna le esportazioni direttamente su Google Drive.',
  'upgrade.modal.benefit.notion': 'Invia le esportazioni nelle pagine Notion.',
  'upgrade.modal.trialNote': 'Plus costa $2.99/mese dopo le prove. Il checkout è gestito in modo sicuro da creem.io.',
  'upgrade.modal.checkout': 'Continua al checkout',
  'upgrade.modal.manage': 'Gestisci abbonamento',

  'trial.free': 'Prova gratuita',
  'trial.exportsLeft': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return '';
    }
    if (count === 0) {
      return 'Nessuna esportazione rimasta';
    }
    const label = pluralize(locale, count, { one: 'esportazione', other: 'esportazioni' });
    return `${count} ${label} rimaste`;
  },
  'trial.exportsLeftShort': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return '';
    }
    const label = pluralize(locale, count, { one: 'esportazione', other: 'esportazioni' });
    return `${count} ${label}`;
  },
  'trial.used': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return 'Prova utilizzata.';
    }
    const label = pluralize(locale, count, { one: 'esportazione', other: 'esportazioni' });
    return `Prova utilizzata. ${count} ${label} rimaste.`;
  },
  'trial.statusChecking': 'Controllo delle esportazioni...',
  'trial.usedUp': 'Le esportazioni di prova sono esaurite.',
  'trial.freeLeft': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return 'Prova gratuita.';
    }
    const label = pluralize(locale, count, { one: 'esportazione', other: 'esportazioni' });
    return `Prova gratuita: ${count} ${label} rimaste.`;
  },

  'account.title': 'Account',
  'account.plan.plus': 'Piano Plus',
  'account.plan.free': 'Piano gratuito',
  'account.endsOn': ({ locale, date }) => `Termina ${date}`,
  'account.endsSoon': 'Termina presto',
  'account.summary.plus': 'Il tuo abbonamento sblocca formati avanzati e consegna su Drive e Notion.',
  'account.summary.free': 'Fai upgrade per sbloccare formati avanzati e consegna su Drive e Notion.',
  'account.manageSubscription': 'Gestisci abbonamento',
  'account.upgradeToPlus': 'Upgrade a Plus',
  'account.destinations': 'Destinazioni',
  'account.connected': 'Connesso',
  'account.notConnected': 'Non connesso',

  'login.subtitle': 'Accedi per sbloccare esportazioni avanzate e consegna su Drive e Notion',
  'login.googleOpening': 'Apertura di Google...',
  'login.googleContinue': 'Continua con Google',
  'login.emailPlaceholder': 'Inserisci la tua email',
  'login.emailHelper': 'Invieremo un codice monouso.',
  'login.sendCode': 'Invia codice di accesso',
  'login.sending': 'Invio in corso...',
  'login.codeSentSuccess': 'Codice inviato! Controlla la tua email.',
  'login.signedInSuccess': 'Accesso effettuato! Ritorno al dashboard.',
  'login.googleError': "Impossibile avviare l'accesso con Google.",
  'login.otpHint': ({ locale, email }) => `Inserisci il codice inviato a ${email}`,
  'login.otpPlaceholder': 'Inserisci il codice di 6 cifre',
  'login.verify': 'Verifica e accedi',
  'login.verifying': 'Verifica in corso...',
  'login.useDifferentEmail': 'Usa un’altra email',
  'login.backToDashboard': 'Torna al dashboard',

  'notice.notionPagesError': 'Impossibile caricare le pagine Notion. Prova ad aggiornare.',
  'notice.driveConnectError': 'Impossibile connettere Google Drive. Riprova.',
  'notice.notionConnectError': 'Impossibile connettere Notion. Riprova.',
  'notice.driveDisconnected': 'Google Drive disconnesso.',
  'notice.notionDisconnected': 'Notion disconnesso.',
  'notice.notionDestinationMissingToken': 'Connetti Notion prima di impostare una pagina di destinazione.',
  'notice.notionDestinationSet': ({ locale, title }) => `Destinazione Notion impostata: ${title}.`,
  'notice.notionDestinationReady': 'La destinazione Notion è pronta.',
  'notice.notionDestinationError': 'Impossibile impostare la destinazione Notion. Riprova.',
  'notice.signInToUpgrade': "Accedi per fare l'upgrade.",
  'notice.checkoutError': 'Impossibile avviare il checkout. Riprova.',
  'notice.billingPortalError': 'Impossibile aprire il portale di fatturazione. Riprova.',
  'notice.signInToUnlock': 'Accedi per sbloccare esportazioni avanzate.',
  'notice.trialsUsedUp': 'Le tue prove gratuite sono esaurite. Fai upgrade per continuare.',
  'notice.notionUnsupportedFormat': ({ locale, contentLabel, formats }) =>
    `Le esportazioni Notion per ${contentLabel} supportano ${formats}.`,
  'notice.connectDriveToContinue': 'Connetti Google Drive per continuare.',
  'notice.connectNotionToContinue': 'Connetti Notion per continuare.',
  'notice.setNotionDestination': 'Imposta una pagina di destinazione Notion per continuare.',
  'notice.noActiveTab': 'Nessuna scheda attiva trovata.',
  'notice.copySuccess': ({ locale, contentLabel, trialMessage }) =>
    `Markdown di ${contentLabel} copiato negli appunti.${trialMessage ?? ''}`,
  'notice.copyFailed': 'Copia non riuscita. Riprova.',
  'notice.exportSuccess': ({ locale, contentLabel, destination, format, trialMessage }) =>
    `${contentLabel} esportato in ${destination} come ${format}.${trialMessage ?? ''}`,
  'notice.exportFailedDrive': 'Esportazione non riuscita. Controlla la connessione a Drive e riprova.',
  'notice.exportFailedNotion': 'Esportazione non riuscita. Controlla la connessione a Notion e la destinazione.',
  'notice.exportFailed': 'Esportazione non riuscita.',
  'notice.notionSpecificFormat': 'Scegli un formato di esportazione specifico per la consegna su Notion.',
  'notice.exportStarted': 'Esportazione avviata. Riceverai una notifica quando è pronta.',
  'notice.extractionFailed': 'Impossibile estrarre il contenuto. Assicurati di essere su una pagina NotebookLM e che il contenuto sia visibile.',
  'notice.contentScriptError': 'Errore di comunicazione con lo script dei contenuti. Aggiorna la pagina e riprova.',
  'notice.signInToConnectDrive': 'Accedi per connettere Google Drive.',
  'notice.signInToConnectNotion': 'Accedi per connettere Notion.',

  'destination.driveRequiresPlus': 'Le esportazioni su Drive richiedono una connessione Google Drive e un abbonamento Plus.',
  'destination.notionRequiresPlus': 'Le esportazioni su Notion richiedono una connessione Notion e un abbonamento Plus.',
  'destination.localInstant': 'Le esportazioni locali sono istantanee. I formati avanzati si sbloccano con Plus.',
};

