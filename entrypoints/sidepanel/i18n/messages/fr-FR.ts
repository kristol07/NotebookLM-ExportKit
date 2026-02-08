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

export const FR_MESSAGES: Record<string, MessageValue> = {
  'app.name': 'NotebookLM ExportKit',
  'common.account': 'Compte',
  'common.signIn': 'Se connecter',
  'common.signOut': 'Se déconnecter',
  'common.close': 'Fermer',
  'common.back': 'Retour',
  'common.upgrade': 'Mettre à niveau',
  'common.connect': 'Connecter',
  'common.disconnect': 'Déconnecter',
  'common.changeAccount': 'Changer de compte',
  'common.changeWorkspace': 'Changer d’espace de travail',
  'common.refreshList': 'Actualiser la liste',
  'common.ready': 'Prêt',
  'common.needsSetup': 'Configuration requise',
  'common.done': 'Terminé',
  'common.unlocked': 'Déverrouillé',
  'common.googleDrive': 'Google Drive',
  'common.notion': 'Notion',
  'common.thisDevice': 'Cet appareil',
  'common.downloads': 'Téléchargements',
  'common.uploadingToDrive': 'Envoi vers Drive',
  'common.signedIn': 'Connecté',
  'common.language': 'Langue',
  'common.settings': 'Paramètres',
  'common.uiLanguage': 'Langue',
  'common.email': 'E-mail',
  'common.orUseEmail': 'ou utiliser l’e-mail',
  'common.exportDestination': 'Destination d’exportation',
  'common.exportToNotion': 'Exporter vers Notion',
  'common.copy': 'Copier',
  'whatsNew.badge': 'Nouveau',
  'whatsNew.title': 'Nouveautes',
  'whatsNew.subtitle': 'Dernieres fonctionnalites de cette version',
  'whatsNew.feature.reportHtmlExport': 'Prise en charge de l\'export de rapport en HTML',
  'whatsNew.feature.chatHtmlExport': 'Prise en charge de l\'export de chat en HTML',
  'whatsNew.action.gotIt': 'Compris',

  'header.signOutTitle': 'Se déconnecter',

  'export.section.quiz': 'Exports de quiz',
  'export.section.flashcards': 'Exports de fiches',
  'export.section.mindmap': 'Exports de cartes mentales',
  'export.section.note': 'Exports de notes',
  'export.section.report': 'Exports de rapports',
  'export.section.chat': 'Exports de chat',
  'export.section.datatable': 'Exports de tableaux de données',
  'export.section.source': 'Exports de sources',
  'export.section.slidedeck': 'Exports de diaporamas',
  'export.option.clipboard': 'Presse-papiers',
  'export.hint.notion': 'Les exports Notion utilisent des mises en page natives.',
  'export.comingSoon': 'Bientôt disponible',
  'export.comingSoonDetail': 'Aperçus vidéo et audio en transcription/diapositives',
  'export.pdfQualityTitle': 'Qualité PDF',
  'export.pdfQualitySize': 'Taille d’abord',
  'export.pdfQualityClarity': 'Clarté d’abord',
  'export.supportedBy': ({ locale, apps }) => {
    if (!apps || typeof apps !== 'string') {
      return 'Pris en charge par';
    }
    return `Pris en charge par ${apps}`;
  },
  'export.destinationHint.drive': 'Les exports Drive nécessitent une connexion Google Drive et un abonnement Plus.',
  'export.destinationHint.notion': 'Les exports Notion nécessitent une connexion Notion et un abonnement Plus.',
  'export.destinationHint.download': 'Les exports locaux sont instantanés. Les formats avancés se débloquent avec Plus.',

  'export.notionLayout.quiz':
    'Questions en encadré, options en puces, bascule indice/réponse, sections de justification',
  'export.notionLayout.flashcards': 'Fiches à bascule avec notes arrière bleues',
  'export.notionLayout.mindmap': 'Titres de section avec plan à puces imbriquées + bascules',
  'export.notionLayout.datatable': 'Tableau de données avec cellules par ligne',
  'export.notionLayout.note': 'Document riche avec paragraphes, tableaux et blocs de code',
  'export.notionLayout.report': 'Rapport riche avec titres, paragraphes, tableaux et blocs de code',
  'export.notionLayout.chat': 'Titres de rôle avec paragraphes, tableaux et blocs de code',
  'export.notionLayout.source': 'Détail de la source avec résumé, sujets clés et contenu structuré',
  'export.notionLayout.slidedeck': 'Document unique avec images de diapositives et bascules de texte alternatif par diapositive',

  'content.quiz': 'Quiz',
  'content.flashcards': 'Fiches',
  'content.mindmap': 'Carte mentale',
  'content.note': 'Note',
  'content.report': 'Rapport',
  'content.chat': 'Chat',
  'content.source': 'Sources',
  'content.datatable': 'Tableau de données',
  'content.slidedeck': 'Diaporama',

  'drive.setup': 'Configuration Drive',
  'drive.step.signIn': '1. Connecte-toi à ton compte',
  'drive.step.upgrade': '2. Passe à Plus',
  'drive.step.connect': '3. Connecte Google Drive',
  'drive.note.subscription': 'Ton abonnement reste associé à ce compte.',
  'drive.note.plus': 'La livraison Drive est disponible avec Plus.',
  'drive.note.connectedAs': ({ locale, email }) => `Connecté en tant que ${email}`,
  'drive.note.chooseAccount': 'Choisis un compte Google pour la livraison Drive.',

  'notion.setup': 'Configuration Notion',
  'notion.step.signIn': '1. Connecte-toi à ton compte',
  'notion.step.upgrade': '2. Passe à Plus',
  'notion.step.connect': '3. Connecte Notion',
  'notion.step.destination': '4. Choisis une page de destination',
  'notion.note.subscription': 'Ton abonnement reste associé à ce compte.',
  'notion.note.plus': 'La livraison Notion est disponible avec Plus.',
  'notion.note.connectedTo': ({ locale, workspace }) => `Connecté à ${workspace}.`,
  'notion.note.authorizeWorkspace': 'Autorise l’espace de travail où les exports doivent arriver.',
  'notion.note.destinationSet': ({ locale, preview }) => `Destination définie (${preview}).`,
  'notion.note.destinationPick': 'Choisis une page pour héberger la base de données NotebookLM ExportKit.',
  'notion.pages.choose': 'Choisir une page Notion',
  'notion.pages.none': 'Aucune page trouvée',
  'notion.saving': 'Enregistrement de la destination...',

  'upgrade.banner.title': 'Forfait Plus',
  'upgrade.banner.note': 'Déverrouille les formats avancés ainsi que la livraison Drive et Notion.',
  'upgrade.modal.title': 'Passer à Plus',
  'upgrade.modal.subtitle.drive': 'Active la livraison Google Drive et les formats avancés.',
  'upgrade.modal.subtitle.notion': 'Active la livraison Notion et les formats avancés.',
  'upgrade.modal.subtitle.format': 'Déverrouille immédiatement les formats d’exportation avancés.',
  'upgrade.modal.subtitle.general': 'Déverrouille les formats avancés ainsi que la livraison Drive et Notion.',
  'upgrade.modal.benefit.formats': 'Formats d’exportation avancés pour les workflows d’étude.',
  'upgrade.modal.benefit.drive': 'Envoie les exports directement vers Google Drive.',
  'upgrade.modal.benefit.notion': 'Envoie les exports vers des pages Notion.',
  'upgrade.modal.trialNote': 'Plus coûte 2,99 $/mois après les essais. Le paiement est géré en toute sécurité par creem.io.',
  'upgrade.modal.checkout': 'Continuer vers le paiement',
  'upgrade.modal.manage': 'Gérer l’abonnement',

  'trial.free': 'Essai gratuit',
  'trial.exportsLeft': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return '';
    }
    if (count === 0) {
      return 'Aucun export restant';
    }
    const label = pluralize(locale, count, { one: 'export', other: 'exports' });
    return `${count} ${label} restants`;
  },
  'trial.exportsLeftShort': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return '';
    }
    const label = pluralize(locale, count, { one: 'export', other: 'exports' });
    return `${count} ${label}`;
  },
  'trial.used': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return 'Essai utilisé.';
    }
    const label = pluralize(locale, count, { one: 'export', other: 'exports' });
    return `Essai utilisé. ${count} ${label} restants.`;
  },
  'trial.statusChecking': 'Vérification des exports...',
  'trial.usedUp': 'Tes exports d’essai sont épuisés.',
  'trial.freeLeft': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return 'Essai gratuit.';
    }
    const label = pluralize(locale, count, { one: 'export', other: 'exports' });
    return `Essai gratuit : ${count} ${label} restants.`;
  },

  'account.title': 'Compte',
  'account.plan.plus': 'Forfait Plus',
  'account.plan.free': 'Forfait gratuit',
  'account.endsOn': ({ locale, date }) => `Se termine ${date}`,
  'account.endsSoon': 'Se termine bientôt',
  'account.summary.plus': 'Ton abonnement déverrouille les formats avancés ainsi que la livraison Drive et Notion.',
  'account.summary.free': 'Passe à Plus pour déverrouiller les formats avancés ainsi que la livraison Drive et Notion.',
  'account.manageSubscription': 'Gérer l’abonnement',
  'account.upgradeToPlus': 'Passer à Plus',
  'account.destinations': 'Destinations',
  'account.connected': 'Connecté',
  'account.notConnected': 'Non connecté',
  'account.supportTitle': 'Contactez-nous',
  'account.supportEmail': 'notebooklm.exportkit@gmail.com',

  'login.subtitle': 'Connecte-toi pour déverrouiller les exports avancés et la livraison Drive et Notion',
  'login.googleOpening': 'Ouverture de Google...',
  'login.googleContinue': 'Continuer avec Google',
  'login.emailPlaceholder': 'Saisis ton e-mail',
  'login.emailHelper': 'Nous enverrons un code à usage unique.',
  'login.sendCode': 'Envoyer le code de connexion',
  'login.sending': 'Envoi en cours...',
  'login.codeSentSuccess': 'Code envoyé ! Vérifie ton e-mail.',
  'login.signedInSuccess': 'Connecté ! Retour au tableau de bord.',
  'login.googleError': 'Impossible de démarrer la connexion Google.',
  'login.otpHint': ({ locale, email }) => `Saisis le code envoyé à ${email}`,
  'login.otpPlaceholder': 'Saisis le code à 6 chiffres',
  'login.verify': 'Vérifier et se connecter',
  'login.verifying': 'Vérification...',
  'login.useDifferentEmail': 'Utiliser un autre e-mail',
  'login.backToDashboard': 'Retour au tableau de bord',

  'notice.notionPagesError': 'Impossible de charger les pages Notion. Essaie d’actualiser.',
  'notice.driveConnectError': 'Impossible de connecter Google Drive. Réessaie.',
  'notice.notionConnectError': 'Impossible de connecter Notion. Réessaie.',
  'notice.driveDisconnected': 'Google Drive déconnecté.',
  'notice.notionDisconnected': 'Notion déconnecté.',
  'notice.notionDestinationMissingToken': 'Connecte Notion avant de définir une page de destination.',
  'notice.notionDestinationSet': ({ locale, title }) => `Destination Notion définie : ${title}.`,
  'notice.notionDestinationReady': 'La destination Notion est prête.',
  'notice.notionDestinationError': 'Impossible de définir la destination Notion. Réessaie.',
  'notice.signInToUpgrade': 'Connecte-toi pour passer à Plus.',
  'notice.checkoutError': 'Impossible de démarrer le paiement. Réessaie.',
  'notice.billingPortalError': 'Impossible d’ouvrir le portail de facturation. Réessaie.',
  'notice.signInToUnlock': 'Connecte-toi pour déverrouiller les exports avancés.',
  'notice.trialsUsedUp': 'Tes essais gratuits sont épuisés. Passe à Plus pour continuer.',
  'notice.notionUnsupportedFormat': ({ locale, contentLabel, formats }) =>
    `Les exports Notion pour ${contentLabel} prennent en charge ${formats}.`,
  'notice.connectDriveToContinue': 'Connecte Google Drive pour continuer.',
  'notice.connectNotionToContinue': 'Connecte Notion pour continuer.',
  'notice.setNotionDestination': 'Définis une page de destination Notion pour continuer.',
  'notice.noActiveTab': 'Aucun onglet actif trouvé.',
  'notice.copySuccess': ({ locale, contentLabel, trialMessage }) =>
    `Markdown de ${contentLabel} copié dans le presse-papiers.${trialMessage ?? ''}`,
  'notice.copyFailed': 'Échec de la copie. Réessaie.',
  'notice.exportSuccess': ({ locale, contentLabel, destination, format, trialMessage }) =>
    `${contentLabel} exporté vers ${destination} au format ${format}.${trialMessage ?? ''}`,
  'notice.exportFailedDrive': 'Échec de l’export. Vérifie la connexion Drive et réessaie.',
  'notice.exportFailedNotion': 'Échec de l’export. Vérifie la connexion Notion et la destination.',
  'notice.exportFailed': 'Échec de l’export.',
  'notice.notionSpecificFormat': 'Choisis un format d’exportation spécifique pour la livraison Notion.',
  'notice.exportStarted': 'Export lancé. Tu seras averti lorsqu’il sera prêt.',
  'notice.extractionFailed': 'Échec de l’extraction du contenu. Assure-toi d’être sur une page NotebookLM et que le contenu soit visible.',
  'notice.contentScriptError': 'Erreur de communication avec le script de contenu. Actualise la page et réessaie.',
  'notice.signInToConnectDrive': 'Connecte-toi pour connecter Google Drive.',
  'notice.signInToConnectNotion': 'Connecte-toi pour connecter Notion.',

  'destination.driveRequiresPlus': 'Les exports Drive nécessitent une connexion Google Drive et un abonnement Plus.',
  'destination.notionRequiresPlus': 'Les exports Notion nécessitent une connexion Notion et un abonnement Plus.',
  'destination.localInstant': 'Les exports locaux sont instantanés. Les formats avancés se débloquent avec Plus.',
};

