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

export const DE_MESSAGES: Record<string, MessageValue> = {
  'app.name': 'NotebookLM ExportKit',
  'common.account': 'Konto',
  'common.signIn': 'Anmelden',
  'common.signOut': 'Abmelden',
  'common.close': 'Schließen',
  'common.back': 'Zurück',
  'common.upgrade': 'Upgrade',
  'common.connect': 'Verbinden',
  'common.disconnect': 'Trennen',
  'common.changeAccount': 'Konto wechseln',
  'common.changeWorkspace': 'Arbeitsbereich wechseln',
  'common.refreshList': 'Liste aktualisieren',
  'common.ready': 'Bereit',
  'common.needsSetup': 'Einrichtung nötig',
  'common.done': 'Fertig',
  'common.unlocked': 'Entsperrt',
  'common.googleDrive': 'Google Drive',
  'common.notion': 'Notion',
  'common.thisDevice': 'Dieses Gerät',
  'common.downloads': 'Downloads',
  'common.uploadingToDrive': 'Wird auf Drive hochgeladen',
  'common.signedIn': 'Angemeldet',
  'common.language': 'Sprache',
  'common.settings': 'Einstellungen',
  'common.uiLanguage': 'Sprache',
  'common.email': 'E-Mail',
  'common.orUseEmail': 'oder E-Mail verwenden',
  'common.exportDestination': 'Exportziel',
  'common.exportToNotion': 'Nach Notion exportieren',
  'common.copy': 'Kopieren',

  'header.signOutTitle': 'Abmelden',

  'export.section.quiz': 'Quiz-Exporte',
  'export.section.flashcards': 'Karteikarten-Exporte',
  'export.section.mindmap': 'Mindmap-Exporte',
  'export.section.note': 'Notiz-Exporte',
  'export.section.report': 'Bericht-Exporte',
  'export.section.chat': 'Chat-Exporte',
  'export.section.datatable': 'Datentabellen-Exporte',
  'export.section.source': 'Quellen-Exporte',
  'export.option.clipboard': 'Zwischenablage',
  'export.hint.notion': 'Notion-Exporte verwenden native Layouts.',
  'export.comingSoon': 'Kommt bald',
  'export.comingSoonDetail': 'Video- und Audio-Overviews zu Transkript/Folien',
  'export.pdfQualityTitle': 'PDF-Qualität',
  'export.pdfQualitySize': 'Größe zuerst',
  'export.pdfQualityClarity': 'Klarheit zuerst',
  'export.supportedBy': ({ locale, apps }) => {
    if (!apps || typeof apps !== 'string') {
      return 'Unterstützt von';
    }
    return `Unterstützt von ${apps}`;
  },
  'export.destinationHint.drive': 'Drive-Exporte erfordern eine Google-Drive-Verbindung und ein Plus-Abo.',
  'export.destinationHint.notion': 'Notion-Exporte erfordern eine Notion-Verbindung und ein Plus-Abo.',
  'export.destinationHint.download': 'Lokale Exporte sind sofort verfügbar. Erweiterte Formate werden mit Plus freigeschaltet.',

  'export.notionLayout.quiz':
    'Callout-Fragen, Optionen als Aufzählung, Hinweis/Antwort-Umschalter, Begründungsabschnitte',
  'export.notionLayout.flashcards': 'Klapptkarten mit blauen Rückseitennotizen',
  'export.notionLayout.mindmap': 'Abschnittsüberschriften mit verschachtelter Gliederung + Umschaltern',
  'export.notionLayout.datatable': 'Datentabelle mit Zeilenzellen',
  'export.notionLayout.note': 'Rich-Dokument mit Absätzen, Tabellen und Codeblöcken',
  'export.notionLayout.report': 'Rich-Report mit Überschriften, Absätzen, Tabellen und Codeblöcken',
  'export.notionLayout.chat': 'Rollenüberschriften mit Absätzen, Tabellen und Codeblöcken',
  'export.notionLayout.source': 'Quellendetail mit Zusammenfassung, Kernthemen und strukturiertem Inhalt',

  'content.quiz': 'Quiz',
  'content.flashcards': 'Karteikarten',
  'content.mindmap': 'Mindmap',
  'content.note': 'Notiz',
  'content.report': 'Bericht',
  'content.chat': 'Chat',
  'content.source': 'Quellen',
  'content.datatable': 'Datentabelle',

  'drive.setup': 'Drive-Einrichtung',
  'drive.step.signIn': '1. Melde dich bei deinem Konto an',
  'drive.step.upgrade': '2. Upgrade auf Plus',
  'drive.step.connect': '3. Google Drive verbinden',
  'drive.note.subscription': 'Dein Abo bleibt mit diesem Konto verbunden.',
  'drive.note.plus': 'Drive-Zustellung ist mit Plus verfügbar.',
  'drive.note.connectedAs': ({ locale, email }) => `Verbunden als ${email}`,
  'drive.note.chooseAccount': 'Wähle ein Google-Konto für die Drive-Zustellung.',

  'notion.setup': 'Notion-Einrichtung',
  'notion.step.signIn': '1. Melde dich bei deinem Konto an',
  'notion.step.upgrade': '2. Upgrade auf Plus',
  'notion.step.connect': '3. Notion verbinden',
  'notion.step.destination': '4. Zielseite auswählen',
  'notion.note.subscription': 'Dein Abo bleibt mit diesem Konto verbunden.',
  'notion.note.plus': 'Notion-Zustellung ist mit Plus verfügbar.',
  'notion.note.connectedTo': ({ locale, workspace }) => `Verbunden mit ${workspace}.`,
  'notion.note.authorizeWorkspace': 'Autorisiere den Arbeitsbereich, in dem Exporte landen sollen.',
  'notion.note.destinationSet': ({ locale, preview }) => `Ziel gesetzt (${preview}).`,
  'notion.note.destinationPick': 'Wähle eine Seite, um die NotebookLM ExportKit-Datenbank zu hosten.',
  'notion.pages.choose': 'Notion-Seite auswählen',
  'notion.pages.none': 'Keine Seiten gefunden',
  'notion.saving': 'Ziel wird gespeichert...',

  'upgrade.banner.title': 'Plus-Plan',
  'upgrade.banner.note': 'Schalte erweiterte Formate sowie Drive- und Notion-Zustellung frei.',
  'upgrade.modal.title': 'Upgrade auf Plus',
  'upgrade.modal.subtitle.drive': 'Aktiviere Google-Drive-Zustellung und erweiterte Formate.',
  'upgrade.modal.subtitle.notion': 'Aktiviere Notion-Zustellung und erweiterte Formate.',
  'upgrade.modal.subtitle.format': 'Schalte erweiterte Exportformate sofort frei.',
  'upgrade.modal.subtitle.general': 'Schalte erweiterte Formate sowie Drive- und Notion-Zustellung frei.',
  'upgrade.modal.benefit.formats': 'Erweiterte Exportformate für Lern-Workflows.',
  'upgrade.modal.benefit.drive': 'Sende Exporte direkt an Google Drive.',
  'upgrade.modal.benefit.notion': 'Sende Exporte an Notion-Seiten.',
  'upgrade.modal.trialNote': 'Plus kostet $2.99/Monat nach den Tests. Checkout wird sicher von creem.io verwaltet.',
  'upgrade.modal.checkout': 'Weiter zum Checkout',
  'upgrade.modal.manage': 'Abo verwalten',

  'trial.free': 'Kostenlose Testversion',
  'trial.exportsLeft': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return '';
    }
    if (count === 0) {
      return 'Keine Exporte mehr übrig';
    }
    const label = pluralize(locale, count, { one: 'Export', other: 'Exporte' });
    return `${count} ${label} übrig`;
  },
  'trial.exportsLeftShort': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return '';
    }
    const label = pluralize(locale, count, { one: 'Export', other: 'Exporte' });
    return `${count} ${label}`;
  },
  'trial.used': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return 'Test genutzt.';
    }
    const label = pluralize(locale, count, { one: 'Export', other: 'Exporte' });
    return `Test genutzt. ${count} ${label} übrig.`;
  },
  'trial.statusChecking': 'Exporte werden geprüft...',
  'trial.usedUp': 'Deine Test-Exporte sind aufgebraucht.',
  'trial.freeLeft': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return 'Kostenlose Testversion.';
    }
    const label = pluralize(locale, count, { one: 'Export', other: 'Exporte' });
    return `Kostenlose Testversion: ${count} ${label} übrig.`;
  },

  'account.title': 'Konto',
  'account.plan.plus': 'Plus-Plan',
  'account.plan.free': 'Gratis-Plan',
  'account.endsOn': ({ locale, date }) => `Endet ${date}`,
  'account.endsSoon': 'Endet bald',
  'account.summary.plus': 'Dein Abo schaltet erweiterte Exportformate sowie Drive- und Notion-Zustellung frei.',
  'account.summary.free': 'Upgrade, um erweiterte Exportformate sowie Drive- und Notion-Zustellung freizuschalten.',
  'account.manageSubscription': 'Abo verwalten',
  'account.upgradeToPlus': 'Upgrade auf Plus',
  'account.destinations': 'Ziele',
  'account.connected': 'Verbunden',
  'account.notConnected': 'Nicht verbunden',

  'login.subtitle': 'Melde dich an, um erweiterte Exporte sowie Drive- und Notion-Zustellung freizuschalten',
  'login.googleOpening': 'Google wird geöffnet...',
  'login.googleContinue': 'Mit Google fortfahren',
  'login.emailPlaceholder': 'Gib deine E-Mail ein',
  'login.emailHelper': 'Wir senden einen Einmalcode.',
  'login.sendCode': 'Login-Code senden',
  'login.sending': 'Wird gesendet...',
  'login.codeSentSuccess': 'Code gesendet! Prüfe deine E-Mail.',
  'login.signedInSuccess': 'Angemeldet! Zurück zum Dashboard.',
  'login.googleError': 'Google-Anmeldung konnte nicht gestartet werden.',
  'login.otpHint': ({ locale, email }) => `Gib den Code ein, der an ${email} gesendet wurde`,
  'login.otpPlaceholder': '6-stelligen Code eingeben',
  'login.verify': 'Bestätigen & Anmelden',
  'login.verifying': 'Wird geprüft...',
  'login.useDifferentEmail': 'Andere E-Mail verwenden',
  'login.backToDashboard': 'Zurück zum Dashboard',

  'notice.notionPagesError': 'Notion-Seiten konnten nicht geladen werden. Bitte aktualisieren.',
  'notice.driveConnectError': 'Google Drive konnte nicht verbunden werden. Bitte versuche es erneut.',
  'notice.notionConnectError': 'Notion konnte nicht verbunden werden. Bitte versuche es erneut.',
  'notice.driveDisconnected': 'Google Drive getrennt.',
  'notice.notionDisconnected': 'Notion getrennt.',
  'notice.notionDestinationMissingToken': 'Verbinde Notion, bevor du eine Zielseite festlegst.',
  'notice.notionDestinationSet': ({ locale, title }) => `Notion-Ziel festgelegt: ${title}.`,
  'notice.notionDestinationReady': 'Notion-Ziel ist bereit.',
  'notice.notionDestinationError': 'Notion-Ziel konnte nicht gesetzt werden. Bitte versuche es erneut.',
  'notice.signInToUpgrade': 'Melde dich an, um upzugraden.',
  'notice.checkoutError': 'Checkout konnte nicht gestartet werden. Bitte versuche es erneut.',
  'notice.billingPortalError': 'Abrechnungsportal konnte nicht geöffnet werden. Bitte versuche es erneut.',
  'notice.signInToUnlock': 'Melde dich an, um erweiterte Exporte freizuschalten.',
  'notice.trialsUsedUp': 'Deine kostenlosen Tests sind aufgebraucht. Upgrade, um fortzufahren.',
  'notice.notionUnsupportedFormat': ({ locale, contentLabel, formats }) =>
    `Notion-Exporte für ${contentLabel} unterstützen ${formats}.`,
  'notice.connectDriveToContinue': 'Verbinde Google Drive, um fortzufahren.',
  'notice.connectNotionToContinue': 'Verbinde Notion, um fortzufahren.',
  'notice.setNotionDestination': 'Lege eine Notion-Zielseite fest, um fortzufahren.',
  'notice.noActiveTab': 'Kein aktiver Tab gefunden.',
  'notice.copySuccess': ({ locale, contentLabel, trialMessage }) =>
    `Markdown für ${contentLabel} in die Zwischenablage kopiert.${trialMessage ?? ''}`,
  'notice.copyFailed': 'Kopieren fehlgeschlagen. Bitte versuche es erneut.',
  'notice.exportSuccess': ({ locale, contentLabel, destination, format, trialMessage }) =>
    `${contentLabel} nach ${destination} als ${format} exportiert.${trialMessage ?? ''}`,
  'notice.exportFailedDrive': 'Export fehlgeschlagen. Prüfe deine Drive-Verbindung und versuche es erneut.',
  'notice.exportFailedNotion': 'Export fehlgeschlagen. Prüfe deine Notion-Verbindung und das Ziel.',
  'notice.exportFailed': 'Export fehlgeschlagen.',
  'notice.notionSpecificFormat': 'Wähle ein bestimmtes Exportformat für die Notion-Zustellung.',
  'notice.exportStarted': 'Export gestartet. Du wirst benachrichtigt, wenn er bereit ist.',
  'notice.extractionFailed': 'Inhalt konnte nicht extrahiert werden. Stelle sicher, dass du auf einer NotebookLM-Seite bist und der Inhalt sichtbar ist.',
  'notice.contentScriptError': 'Fehler bei der Kommunikation mit dem Content-Skript. Seite aktualisieren und erneut versuchen.',
  'notice.signInToConnectDrive': 'Melde dich an, um Google Drive zu verbinden.',
  'notice.signInToConnectNotion': 'Melde dich an, um Notion zu verbinden.',

  'destination.driveRequiresPlus': 'Drive-Exporte erfordern eine Google-Drive-Verbindung und ein Plus-Abo.',
  'destination.notionRequiresPlus': 'Notion-Exporte erfordern eine Notion-Verbindung und ein Plus-Abo.',
  'destination.localInstant': 'Lokale Exporte sind sofort verfügbar. Erweiterte Formate werden mit Plus freigeschaltet.',
};

