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

export const EN_MESSAGES: Record<string, MessageValue> = {
  'app.name': 'NotebookLM ExportKit',
  'common.account': 'Account',
  'common.signIn': 'Sign In',
  'common.signOut': 'Sign Out',
  'common.close': 'Close',
  'common.back': 'Back',
  'common.upgrade': 'Upgrade',
  'common.connect': 'Connect',
  'common.disconnect': 'Disconnect',
  'common.changeAccount': 'Change account',
  'common.changeWorkspace': 'Change workspace',
  'common.refreshList': 'Refresh list',
  'common.ready': 'Ready',
  'common.needsSetup': 'Needs setup',
  'common.done': 'Done',
  'common.unlocked': 'Unlocked',
  'common.googleDrive': 'Google Drive',
  'common.notion': 'Notion',
  'common.thisDevice': 'This device',
  'common.downloads': 'Downloads',
  'common.uploadingToDrive': 'Uploading to Drive',
  'common.signedIn': 'Signed in',
  'common.language': 'Language',
  'common.settings': 'Settings',
  'common.uiLanguage': 'Language',
  'common.email': 'Email',
  'common.orUseEmail': 'or use email',
  'common.exportDestination': 'Export destination',
  'common.exportToNotion': 'Export to Notion',
  'common.copy': 'Copy',

  'header.signOutTitle': 'Sign Out',

  'export.section.quiz': 'Quiz Exports',
  'export.section.flashcards': 'Flashcard Exports',
  'export.section.mindmap': 'Mindmap Exports',
  'export.section.note': 'Note Exports',
  'export.section.report': 'Report Exports',
  'export.section.chat': 'Chat Exports',
  'export.section.datatable': 'Data Table Exports',
  'export.section.source': 'Source Exports',
  'export.option.clipboard': 'Clipboard',
  'export.hint.notion': 'Notion exports use native layouts.',
  'export.comingSoon': 'Coming soon',
  'export.comingSoonDetail': 'Video & Audio Overviews to Transcript/Slides',
  'export.pdfQualityTitle': 'PDF quality',
  'export.pdfQualitySize': 'Size first',
  'export.pdfQualityClarity': 'Clarity first',
  'export.supportedBy': ({ locale, apps }) => {
    if (!apps || typeof apps !== 'string') {
      return 'Supported by';
    }
    return `Supported by ${apps}`;
  },
  'export.destinationHint.drive': 'Drive exports require a Google Drive connection and a Plus subscription.',
  'export.destinationHint.notion': 'Notion exports require a Notion connection and a Plus subscription.',
  'export.destinationHint.download': 'Local exports are instant. Advanced formats unlock with Plus.',

  'export.notionLayout.quiz': 'Callout questions, option bullets, hint/answer toggles, rationale sections',
  'export.notionLayout.flashcards': 'Toggle cards with blue back notes',
  'export.notionLayout.mindmap': 'Section headings with nested bullet outline + toggles',
  'export.notionLayout.datatable': 'Data table with row cells',
  'export.notionLayout.note': 'Rich doc with paragraphs, tables, and code blocks',
  'export.notionLayout.report': 'Rich report with headings, paragraphs, tables, and code blocks',
  'export.notionLayout.chat': 'Role headings with paragraphs, tables, and code blocks',
  'export.notionLayout.source': 'Source detail with summary, key topics, and structured content',

  'content.quiz': 'Quiz',
  'content.flashcards': 'Flashcards',
  'content.mindmap': 'Mindmap',
  'content.note': 'Note',
  'content.report': 'Report',
  'content.chat': 'Chat',
  'content.source': 'Sources',
  'content.datatable': 'Data table',

  'drive.setup': 'Drive setup',
  'drive.step.signIn': '1. Sign in to your account',
  'drive.step.upgrade': '2. Upgrade to Plus',
  'drive.step.connect': '3. Connect Google Drive',
  'drive.note.subscription': 'Your subscription stays with this account.',
  'drive.note.plus': 'Drive delivery is available on Plus.',
  'drive.note.connectedAs': ({ locale, email }) => `Connected as ${email}`,
  'drive.note.chooseAccount': 'Choose any Google account for Drive delivery.',

  'notion.setup': 'Notion setup',
  'notion.step.signIn': '1. Sign in to your account',
  'notion.step.upgrade': '2. Upgrade to Plus',
  'notion.step.connect': '3. Connect Notion',
  'notion.step.destination': '4. Pick a destination page',
  'notion.note.subscription': 'Your subscription stays with this account.',
  'notion.note.plus': 'Notion delivery is available on Plus.',
  'notion.note.connectedTo': ({ locale, workspace }) => `Connected to ${workspace}.`,
  'notion.note.authorizeWorkspace': 'Authorize the workspace where exports should land.',
  'notion.note.destinationSet': ({ locale, preview }) => `Destination set (${preview}).`,
  'notion.note.destinationPick': 'Pick a page to host the NotebookLM ExportKit database.',
  'notion.pages.choose': 'Choose a Notion page',
  'notion.pages.none': 'No pages found',
  'notion.saving': 'Saving destination...',

  'upgrade.banner.title': 'Plus plan',
  'upgrade.banner.note': 'Unlock advanced formats plus Drive and Notion delivery.',
  'upgrade.modal.title': 'Upgrade to Plus',
  'upgrade.modal.subtitle.drive': 'Enable Google Drive delivery and advanced formats.',
  'upgrade.modal.subtitle.notion': 'Enable Notion delivery and advanced formats.',
  'upgrade.modal.subtitle.format': 'Unlock advanced export formats instantly.',
  'upgrade.modal.subtitle.general': 'Unlock advanced formats plus Drive and Notion delivery.',
  'upgrade.modal.benefit.formats': 'Advanced export formats for study workflows.',
  'upgrade.modal.benefit.drive': 'Deliver exports directly to Google Drive.',
  'upgrade.modal.benefit.notion': 'Send exports into Notion pages.',
  'upgrade.modal.trialNote': 'Plus is $2.99/month after your trials. Checkout is managed securely by creem.io.',
  'upgrade.modal.checkout': 'Continue to checkout',
  'upgrade.modal.manage': 'Manage subscription',

  'trial.free': 'Free trial',
  'trial.exportsLeft': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return '';
    }
    if (count === 0) {
      return 'No exports left';
    }
    const label = pluralize(locale, count, { one: 'export', other: 'exports' });
    return `${count} ${label} left`;
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
      return 'Trial used.';
    }
    const label = pluralize(locale, count, { one: 'export', other: 'exports' });
    return `Trial used. ${count} ${label} left.`;
  },
  'trial.statusChecking': 'Checking exports...',
  'trial.usedUp': 'Your free trial exports are used up.',
  'trial.freeLeft': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return 'Free trial.';
    }
    const label = pluralize(locale, count, { one: 'export', other: 'exports' });
    return `Free trial: ${count} ${label} left.`;
  },

  'account.title': 'Account',
  'account.plan.plus': 'Plus plan',
  'account.plan.free': 'Free plan',
  'account.endsOn': ({ locale, date }) => `Ends ${date}`,
  'account.endsSoon': 'Ends soon',
  'account.summary.plus': 'Your subscription unlocks advanced export formats plus Drive and Notion delivery.',
  'account.summary.free': 'Upgrade to unlock advanced export formats plus Drive and Notion delivery.',
  'account.manageSubscription': 'Manage Subscription',
  'account.upgradeToPlus': 'Upgrade to Plus',
  'account.destinations': 'Destinations',
  'account.connected': 'Connected',
  'account.notConnected': 'Not connected',

  'login.subtitle': 'Sign in to unlock advanced exports plus Drive and Notion delivery',
  'login.googleOpening': 'Opening Google...',
  'login.googleContinue': 'Continue with Google',
  'login.emailPlaceholder': 'Enter your email',
  'login.emailHelper': 'We will send a one-time code.',
  'login.sendCode': 'Send Login Code',
  'login.sending': 'Sending...',
  'login.codeSentSuccess': 'Code sent! Check your email.',
  'login.signedInSuccess': 'Signed in! Returning to the dashboard.',
  'login.googleError': 'Unable to start Google sign-in.',
  'login.otpHint': ({ locale, email }) => `Enter the code sent to ${email}`,
  'login.otpPlaceholder': 'Enter 6-digit Code',
  'login.verify': 'Verify & Login',
  'login.verifying': 'Verifying...',
  'login.useDifferentEmail': 'Use a different email',
  'login.backToDashboard': 'Back to Dashboard',

  'notice.notionPagesError': 'Could not load Notion pages. Try refreshing.',
  'notice.driveConnectError': 'Could not connect Google Drive. Please try again.',
  'notice.notionConnectError': 'Could not connect Notion. Please try again.',
  'notice.driveDisconnected': 'Google Drive disconnected.',
  'notice.notionDisconnected': 'Notion disconnected.',
  'notice.notionDestinationMissingToken': 'Connect Notion before setting a destination page.',
  'notice.notionDestinationSet': ({ locale, title }) => `Notion destination set: ${title}.`,
  'notice.notionDestinationReady': 'Notion destination is ready.',
  'notice.notionDestinationError': 'Could not set the Notion destination. Please try again.',
  'notice.signInToUpgrade': 'Sign in to upgrade.',
  'notice.checkoutError': 'Could not start checkout. Please try again.',
  'notice.billingPortalError': 'Could not open billing portal. Please try again.',
  'notice.signInToUnlock': 'Sign in to unlock advanced exports.',
  'notice.trialsUsedUp': 'Your free trials are used up. Upgrade to continue.',
  'notice.notionUnsupportedFormat': ({ locale, contentLabel, formats }) =>
    `Notion exports for ${contentLabel} support ${formats}.`,
  'notice.connectDriveToContinue': 'Connect Google Drive to continue.',
  'notice.connectNotionToContinue': 'Connect Notion to continue.',
  'notice.setNotionDestination': 'Set a Notion destination page to continue.',
  'notice.noActiveTab': 'No active tab found.',
  'notice.copySuccess': ({ locale, contentLabel, trialMessage }) =>
    `Copied ${contentLabel} Markdown to Clipboard.${trialMessage ?? ''}`,
  'notice.copyFailed': 'Copy failed. Please try again.',
  'notice.exportSuccess': ({ locale, contentLabel, destination, format, trialMessage }) =>
    `Exported ${contentLabel} to ${destination} as ${format}.${trialMessage ?? ''}`,
  'notice.exportFailedDrive': 'Export failed. Check your Drive connection and try again.',
  'notice.exportFailedNotion': 'Export failed. Check your Notion connection and destination.',
  'notice.exportFailed': 'Export failed.',
  'notice.notionSpecificFormat': 'Choose a specific export format for Notion delivery.',
  'notice.exportStarted': 'Export started. You will be prompted when it is ready.',
  'notice.extractionFailed': 'Failed to extract content. Ensure you are on a NotebookLM page and the content is visible.',
  'notice.contentScriptError': 'Error communicating with content script. Refresh the page and try again.',
  'notice.signInToConnectDrive': 'Sign in to connect Google Drive.',
  'notice.signInToConnectNotion': 'Sign in to connect Notion.',

  'destination.driveRequiresPlus': 'Drive exports require a Google Drive connection and a Plus subscription.',
  'destination.notionRequiresPlus': 'Notion exports require a Notion connection and a Plus subscription.',
  'destination.localInstant': 'Local exports are instant. Advanced formats unlock with Plus.',
};

