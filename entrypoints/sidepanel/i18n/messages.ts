export type Locale = 'en-US' | 'es-ES' | 'de-DE' | 'it-IT' | 'pt-BR' | 'fr-FR';

export const DEFAULT_LOCALE: Locale = 'en-US';

export const LOCALE_LABELS: Record<Locale, string> = {
  'en-US': 'English (US)',
  'es-ES': 'Español (España)',
  'de-DE': 'Deutsch (Deutschland)',
  'it-IT': 'Italiano (Italia)',
  'pt-BR': 'Português (Brasil)',
  'fr-FR': 'Français (France)',
};

export type MessageParams = Record<string, string | number | undefined> & {
  locale: Locale;
};

type MessageValue = string | ((params: MessageParams) => string);

const pluralize = (locale: Locale, count: number, forms: { one: string; other: string }) => {
  const rule = new Intl.PluralRules(locale).select(count);
  return rule === 'one' ? forms.one : forms.other;
};

const EN_MESSAGES: Record<string, MessageValue> = {
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
  'common.uiLanguage': 'UI language',
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

const ES_MESSAGES: Record<string, MessageValue> = {
  'app.name': 'NotebookLM ExportKit',
  'common.account': 'Cuenta',
  'common.signIn': 'Iniciar sesión',
  'common.signOut': 'Cerrar sesión',
  'common.close': 'Cerrar',
  'common.back': 'Volver',
  'common.upgrade': 'Actualizar',
  'common.connect': 'Conectar',
  'common.disconnect': 'Desconectar',
  'common.changeAccount': 'Cambiar cuenta',
  'common.changeWorkspace': 'Cambiar espacio',
  'common.refreshList': 'Actualizar lista',
  'common.ready': 'Listo',
  'common.needsSetup': 'Falta configurar',
  'common.done': 'Hecho',
  'common.unlocked': 'Desbloqueado',
  'common.googleDrive': 'Google Drive',
  'common.notion': 'Notion',
  'common.thisDevice': 'Esta computadora',
  'common.downloads': 'Descargas',
  'common.uploadingToDrive': 'Subiendo a Drive',
  'common.signedIn': 'Sesión iniciada',
  'common.language': 'Idioma',
  'common.uiLanguage': 'Idioma de la interfaz',
  'common.email': 'Correo',
  'common.orUseEmail': 'o usar correo',
  'common.exportDestination': 'Destino de exportación',
  'common.exportToNotion': 'Exportar a Notion',
  'common.copy': 'Copiar',

  'header.signOutTitle': 'Cerrar sesión',

  'export.section.quiz': 'Exportaciones de cuestionarios',
  'export.section.flashcards': 'Exportaciones de tarjetas',
  'export.section.mindmap': 'Exportaciones de mapas mentales',
  'export.section.note': 'Exportaciones de notas',
  'export.section.report': 'Exportaciones de informes',
  'export.section.chat': 'Exportaciones de chat',
  'export.section.datatable': 'Exportaciones de tablas de datos',
  'export.section.source': 'Exportaciones de fuentes',
  'export.option.clipboard': 'Portapapeles',
  'export.hint.notion': 'Las exportaciones a Notion usan diseños nativos.',
  'export.comingSoon': 'Próximamente',
  'export.comingSoonDetail': 'Resúmenes de video y audio a transcripción/diapositivas',
  'export.pdfQualityTitle': 'Calidad de PDF',
  'export.pdfQualitySize': 'Priorizar tamaño',
  'export.pdfQualityClarity': 'Priorizar claridad',
  'export.supportedBy': ({ locale, apps }) => {
    if (!apps || typeof apps !== 'string') {
      return 'Compatible con';
    }
    return `Compatible con ${apps}`;
  },
  'export.destinationHint.drive': 'Las exportaciones a Drive requieren conexión a Google Drive y suscripción Plus.',
  'export.destinationHint.notion': 'Las exportaciones a Notion requieren conexión a Notion y suscripción Plus.',
  'export.destinationHint.download': 'Las exportaciones locales son instantáneas. Los formatos avanzados se desbloquean con Plus.',

  'export.notionLayout.quiz': 'Preguntas en resaltado, opciones en viñetas, alternar pistas/respuestas, secciones de explicación',
  'export.notionLayout.flashcards': 'Tarjetas con alternar y notas traseras en azul',
  'export.notionLayout.mindmap': 'Títulos de sección con esquema de viñetas y alternar',
  'export.notionLayout.datatable': 'Tabla de datos con celdas de fila',
  'export.notionLayout.note': 'Documento rico con párrafos, tablas y bloques de código',
  'export.notionLayout.report': 'Informe rico con títulos, párrafos, tablas y bloques de código',
  'export.notionLayout.chat': 'Encabezados de roles con párrafos, tablas y bloques de código',
  'export.notionLayout.source': 'Detalle de fuente con resumen, temas clave y contenido estructurado',

  'content.quiz': 'Cuestionario',
  'content.flashcards': 'Tarjetas',
  'content.mindmap': 'Mapa mental',
  'content.note': 'Nota',
  'content.report': 'Informe',
  'content.chat': 'Chat',
  'content.source': 'Fuentes',
  'content.datatable': 'Tabla de datos',

  'drive.setup': 'Configuración de Drive',
  'drive.step.signIn': '1. Inicia sesión en tu cuenta',
  'drive.step.upgrade': '2. Actualiza a Plus',
  'drive.step.connect': '3. Conecta Google Drive',
  'drive.note.subscription': 'Tu suscripción se mantiene con esta cuenta.',
  'drive.note.plus': 'La entrega a Drive está disponible en Plus.',
  'drive.note.connectedAs': ({ locale, email }) => `Conectado como ${email}`,
  'drive.note.chooseAccount': 'Elige cualquier cuenta de Google para la entrega en Drive.',

  'notion.setup': 'Configuración de Notion',
  'notion.step.signIn': '1. Inicia sesión en tu cuenta',
  'notion.step.upgrade': '2. Actualiza a Plus',
  'notion.step.connect': '3. Conecta Notion',
  'notion.step.destination': '4. Elige una página de destino',
  'notion.note.subscription': 'Tu suscripción se mantiene con esta cuenta.',
  'notion.note.plus': 'La entrega a Notion está disponible en Plus.',
  'notion.note.connectedTo': ({ locale, workspace }) => `Conectado a ${workspace}.`,
  'notion.note.authorizeWorkspace': 'Autoriza el espacio donde deben llegar las exportaciones.',
  'notion.note.destinationSet': ({ locale, preview }) => `Destino establecido (${preview}).`,
  'notion.note.destinationPick': 'Elige una página para alojar la base de datos de NotebookLM ExportKit.',
  'notion.pages.choose': 'Elige una página de Notion',
  'notion.pages.none': 'No se encontraron páginas',
  'notion.saving': 'Guardando destino...',

  'upgrade.banner.title': 'Plan Plus',
  'upgrade.banner.note': 'Desbloquea formatos avanzados y entrega a Drive y Notion.',
  'upgrade.modal.title': 'Actualiza a Plus',
  'upgrade.modal.subtitle.drive': 'Habilita entrega a Google Drive y formatos avanzados.',
  'upgrade.modal.subtitle.notion': 'Habilita entrega a Notion y formatos avanzados.',
  'upgrade.modal.subtitle.format': 'Desbloquea formatos avanzados al instante.',
  'upgrade.modal.subtitle.general': 'Desbloquea formatos avanzados y entrega a Drive y Notion.',
  'upgrade.modal.benefit.formats': 'Formatos avanzados para flujos de estudio.',
  'upgrade.modal.benefit.drive': 'Entrega exportaciones directamente a Google Drive.',
  'upgrade.modal.benefit.notion': 'Envía exportaciones a páginas de Notion.',
  'upgrade.modal.trialNote': 'Plus cuesta $2.99/mes después de las pruebas. El pago se gestiona de forma segura por creem.io.',
  'upgrade.modal.checkout': 'Continuar al pago',
  'upgrade.modal.manage': 'Administrar suscripción',

  'trial.free': 'Prueba gratis',
  'trial.exportsLeft': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return '';
    }
    if (count === 0) {
      return 'No quedan exportaciones';
    }
    const label = pluralize(locale, count, { one: 'exportación', other: 'exportaciones' });
    return `${count} ${label} restantes`;
  },
  'trial.exportsLeftShort': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return '';
    }
    const label = pluralize(locale, count, { one: 'exportación', other: 'exportaciones' });
    return `${count} ${label}`;
  },
  'trial.used': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return 'Prueba usada.';
    }
    const label = pluralize(locale, count, { one: 'exportación', other: 'exportaciones' });
    return `Prueba usada. ${count} ${label} restantes.`;
  },
  'trial.statusChecking': 'Comprobando exportaciones...',
  'trial.usedUp': 'Tus exportaciones de prueba se agotaron.',
  'trial.freeLeft': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return 'Prueba gratis.';
    }
    const label = pluralize(locale, count, { one: 'exportación', other: 'exportaciones' });
    return `Prueba gratis: ${count} ${label} restantes.`;
  },

  'account.title': 'Cuenta',
  'account.plan.plus': 'Plan Plus',
  'account.plan.free': 'Plan gratis',
  'account.endsOn': ({ locale, date }) => `Finaliza ${date}`,
  'account.endsSoon': 'Finaliza pronto',
  'account.summary.plus': 'Tu suscripción desbloquea formatos avanzados y entrega a Drive y Notion.',
  'account.summary.free': 'Actualiza para desbloquear formatos avanzados y entrega a Drive y Notion.',
  'account.manageSubscription': 'Administrar suscripción',
  'account.upgradeToPlus': 'Actualizar a Plus',
  'account.destinations': 'Destinos',
  'account.connected': 'Conectado',
  'account.notConnected': 'No conectado',

  'login.subtitle': 'Inicia sesión para desbloquear exportaciones avanzadas y entrega a Drive y Notion',
  'login.googleOpening': 'Abriendo Google...',
  'login.googleContinue': 'Continuar con Google',
  'login.emailPlaceholder': 'Ingresa tu correo',
  'login.emailHelper': 'Enviaremos un código de un solo uso.',
  'login.sendCode': 'Enviar código de inicio',
  'login.sending': 'Enviando...',
  'login.codeSentSuccess': '¡Código enviado! Revisa tu correo.',
  'login.signedInSuccess': '¡Sesión iniciada! Volviendo al panel.',
  'login.googleError': 'No se pudo iniciar sesión con Google.',
  'login.otpHint': ({ locale, email }) => `Ingresa el código enviado a ${email}`,
  'login.otpPlaceholder': 'Ingresa el código de 6 dígitos',
  'login.verify': 'Verificar e iniciar sesión',
  'login.verifying': 'Verificando...',
  'login.useDifferentEmail': 'Usar otro correo',
  'login.backToDashboard': 'Volver al panel',

  'notice.notionPagesError': 'No se pudieron cargar las páginas de Notion. Intenta actualizar.',
  'notice.driveConnectError': 'No se pudo conectar Google Drive. Intenta de nuevo.',
  'notice.notionConnectError': 'No se pudo conectar Notion. Intenta de nuevo.',
  'notice.driveDisconnected': 'Google Drive desconectado.',
  'notice.notionDisconnected': 'Notion desconectado.',
  'notice.notionDestinationMissingToken': 'Conecta Notion antes de establecer una página de destino.',
  'notice.notionDestinationSet': ({ locale, title }) => `Destino de Notion establecido: ${title}.`,
  'notice.notionDestinationReady': 'El destino de Notion está listo.',
  'notice.notionDestinationError': 'No se pudo establecer el destino de Notion. Intenta de nuevo.',
  'notice.signInToUpgrade': 'Inicia sesión para actualizar.',
  'notice.checkoutError': 'No se pudo iniciar el pago. Intenta de nuevo.',
  'notice.billingPortalError': 'No se pudo abrir el portal de facturación. Intenta de nuevo.',
  'notice.signInToUnlock': 'Inicia sesión para desbloquear exportaciones avanzadas.',
  'notice.trialsUsedUp': 'Tus pruebas gratuitas se agotaron. Actualiza para continuar.',
  'notice.notionUnsupportedFormat': ({ locale, contentLabel, formats }) =>
    `Las exportaciones de Notion para ${contentLabel} admiten ${formats}.`,
  'notice.connectDriveToContinue': 'Conecta Google Drive para continuar.',
  'notice.connectNotionToContinue': 'Conecta Notion para continuar.',
  'notice.setNotionDestination': 'Establece una página de destino de Notion para continuar.',
  'notice.noActiveTab': 'No se encontró una pestaña activa.',
  'notice.copySuccess': ({ locale, contentLabel, trialMessage }) =>
    `Se copió ${contentLabel} en Markdown al portapapeles.${trialMessage ?? ''}`,
  'notice.copyFailed': 'Falló la copia. Intenta de nuevo.',
  'notice.exportSuccess': ({ locale, contentLabel, destination, format, trialMessage }) =>
    `Se exportó ${contentLabel} a ${destination} como ${format}.${trialMessage ?? ''}`,
  'notice.exportFailedDrive': 'La exportación falló. Revisa la conexión de Drive e intenta de nuevo.',
  'notice.exportFailedNotion': 'La exportación falló. Revisa la conexión de Notion y el destino.',
  'notice.exportFailed': 'La exportación falló.',
  'notice.notionSpecificFormat': 'Elige un formato de exportación específico para la entrega en Notion.',
  'notice.exportStarted': 'La exportación comenzó. Se te notificará cuando esté lista.',
  'notice.extractionFailed': 'No se pudo extraer el contenido. Asegúrate de estar en NotebookLM y que el contenido esté visible.',
  'notice.contentScriptError': 'Error al comunicar con el script. Actualiza la página e intenta de nuevo.',
  'notice.signInToConnectDrive': 'Inicia sesión para conectar Google Drive.',
  'notice.signInToConnectNotion': 'Inicia sesión para conectar Notion.',

  'destination.driveRequiresPlus': 'Las exportaciones a Drive requieren conexión a Google Drive y suscripción Plus.',
  'destination.notionRequiresPlus': 'Las exportaciones a Notion requieren conexión a Notion y suscripción Plus.',
  'destination.localInstant': 'Las exportaciones locales son instantáneas. Los formatos avanzados se desbloquean con Plus.',
};

const DE_MESSAGES: Record<string, MessageValue> = {
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
  'common.uiLanguage': 'Sprache der Benutzeroberfläche',
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

const IT_MESSAGES: Record<string, MessageValue> = {
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
  'common.uiLanguage': "Lingua dell'interfaccia",
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

const PT_MESSAGES: Record<string, MessageValue> = {
  'app.name': 'NotebookLM ExportKit',
  'common.account': 'Conta',
  'common.signIn': 'Entrar',
  'common.signOut': 'Sair',
  'common.close': 'Fechar',
  'common.back': 'Voltar',
  'common.upgrade': 'Fazer upgrade',
  'common.connect': 'Conectar',
  'common.disconnect': 'Desconectar',
  'common.changeAccount': 'Trocar conta',
  'common.changeWorkspace': 'Trocar workspace',
  'common.refreshList': 'Atualizar lista',
  'common.ready': 'Pronto',
  'common.needsSetup': 'Precisa de configuração',
  'common.done': 'Concluído',
  'common.unlocked': 'Desbloqueado',
  'common.googleDrive': 'Google Drive',
  'common.notion': 'Notion',
  'common.thisDevice': 'Este dispositivo',
  'common.downloads': 'Downloads',
  'common.uploadingToDrive': 'Enviando para o Drive',
  'common.signedIn': 'Conectado',
  'common.language': 'Idioma',
  'common.uiLanguage': 'Idioma da interface',
  'common.email': 'E-mail',
  'common.orUseEmail': 'ou usar e-mail',
  'common.exportDestination': 'Destino de exportação',
  'common.exportToNotion': 'Exportar para o Notion',
  'common.copy': 'Copiar',

  'header.signOutTitle': 'Sair',

  'export.section.quiz': 'Exportações de quiz',
  'export.section.flashcards': 'Exportações de flashcards',
  'export.section.mindmap': 'Exportações de mapa mental',
  'export.section.note': 'Exportações de notas',
  'export.section.report': 'Exportações de relatórios',
  'export.section.chat': 'Exportações de chat',
  'export.section.datatable': 'Exportações de tabela de dados',
  'export.section.source': 'Exportações de fontes',
  'export.option.clipboard': 'Área de transferência',
  'export.hint.notion': 'Exportações para o Notion usam layouts nativos.',
  'export.comingSoon': 'Em breve',
  'export.comingSoonDetail': 'Visões gerais de vídeo e áudio para transcrição/apresentações',
  'export.pdfQualityTitle': 'Qualidade do PDF',
  'export.pdfQualitySize': 'Tamanho primeiro',
  'export.pdfQualityClarity': 'Clareza primeiro',
  'export.supportedBy': ({ locale, apps }) => {
    if (!apps || typeof apps !== 'string') {
      return 'Compatível com';
    }
    return `Compatível com ${apps}`;
  },
  'export.destinationHint.drive': 'As exportações para o Drive exigem conexão com o Google Drive e assinatura Plus.',
  'export.destinationHint.notion': 'As exportações para o Notion exigem conexão com o Notion e assinatura Plus.',
  'export.destinationHint.download': 'As exportações locais são instantâneas. Formatos avançados desbloqueiam com Plus.',

  'export.notionLayout.quiz':
    'Perguntas em destaque, opções em marcadores, alternância de dica/resposta, seções de explicação',
  'export.notionLayout.flashcards': 'Cartões com alternância e notas traseiras em azul',
  'export.notionLayout.mindmap': 'Títulos de seção com lista aninhada + alternâncias',
  'export.notionLayout.datatable': 'Tabela de dados com células de linha',
  'export.notionLayout.note': 'Documento rico com parágrafos, tabelas e blocos de código',
  'export.notionLayout.report': 'Relatório rico com títulos, parágrafos, tabelas e blocos de código',
  'export.notionLayout.chat': 'Títulos de função com parágrafos, tabelas e blocos de código',
  'export.notionLayout.source': 'Detalhe da fonte com resumo, tópicos principais e conteúdo estruturado',

  'content.quiz': 'Quiz',
  'content.flashcards': 'Flashcards',
  'content.mindmap': 'Mapa mental',
  'content.note': 'Nota',
  'content.report': 'Relatório',
  'content.chat': 'Chat',
  'content.source': 'Fontes',
  'content.datatable': 'Tabela de dados',

  'drive.setup': 'Configuração do Drive',
  'drive.step.signIn': '1. Entre na sua conta',
  'drive.step.upgrade': '2. Faça upgrade para o Plus',
  'drive.step.connect': '3. Conecte o Google Drive',
  'drive.note.subscription': 'Sua assinatura fica com esta conta.',
  'drive.note.plus': 'Entrega no Drive disponível no Plus.',
  'drive.note.connectedAs': ({ locale, email }) => `Conectado como ${email}`,
  'drive.note.chooseAccount': 'Escolha qualquer conta Google para entrega no Drive.',

  'notion.setup': 'Configuração do Notion',
  'notion.step.signIn': '1. Entre na sua conta',
  'notion.step.upgrade': '2. Faça upgrade para o Plus',
  'notion.step.connect': '3. Conecte o Notion',
  'notion.step.destination': '4. Escolha uma página de destino',
  'notion.note.subscription': 'Sua assinatura fica com esta conta.',
  'notion.note.plus': 'Entrega no Notion disponível no Plus.',
  'notion.note.connectedTo': ({ locale, workspace }) => `Conectado a ${workspace}.`,
  'notion.note.authorizeWorkspace': 'Autorize o workspace onde as exportações devem chegar.',
  'notion.note.destinationSet': ({ locale, preview }) => `Destino definido (${preview}).`,
  'notion.note.destinationPick': 'Escolha uma página para hospedar o banco de dados do NotebookLM ExportKit.',
  'notion.pages.choose': 'Escolha uma página do Notion',
  'notion.pages.none': 'Nenhuma página encontrada',
  'notion.saving': 'Salvando destino...',

  'upgrade.banner.title': 'Plano Plus',
  'upgrade.banner.note': 'Desbloqueie formatos avançados e entrega no Drive e Notion.',
  'upgrade.modal.title': 'Fazer upgrade para o Plus',
  'upgrade.modal.subtitle.drive': 'Ative a entrega no Google Drive e formatos avançados.',
  'upgrade.modal.subtitle.notion': 'Ative a entrega no Notion e formatos avançados.',
  'upgrade.modal.subtitle.format': 'Desbloqueie formatos avançados instantaneamente.',
  'upgrade.modal.subtitle.general': 'Desbloqueie formatos avançados e entrega no Drive e Notion.',
  'upgrade.modal.benefit.formats': 'Formatos avançados para fluxos de estudo.',
  'upgrade.modal.benefit.drive': 'Envie exportações diretamente para o Google Drive.',
  'upgrade.modal.benefit.notion': 'Envie exportações para páginas do Notion.',
  'upgrade.modal.trialNote': 'Plus custa US$ 2,99/mês após os testes. O checkout é gerenciado com segurança pela creem.io.',
  'upgrade.modal.checkout': 'Continuar para o checkout',
  'upgrade.modal.manage': 'Gerenciar assinatura',

  'trial.free': 'Teste grátis',
  'trial.exportsLeft': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return '';
    }
    if (count === 0) {
      return 'Nenhuma exportação restante';
    }
    const label = pluralize(locale, count, { one: 'exportação', other: 'exportações' });
    return `${count} ${label} restantes`;
  },
  'trial.exportsLeftShort': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return '';
    }
    const label = pluralize(locale, count, { one: 'exportação', other: 'exportações' });
    return `${count} ${label}`;
  },
  'trial.used': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return 'Teste usado.';
    }
    const label = pluralize(locale, count, { one: 'exportação', other: 'exportações' });
    return `Teste usado. ${count} ${label} restantes.`;
  },
  'trial.statusChecking': 'Verificando exportações...',
  'trial.usedUp': 'Suas exportações de teste acabaram.',
  'trial.freeLeft': ({ locale, count }) => {
    if (typeof count !== 'number') {
      return 'Teste grátis.';
    }
    const label = pluralize(locale, count, { one: 'exportação', other: 'exportações' });
    return `Teste grátis: ${count} ${label} restantes.`;
  },

  'account.title': 'Conta',
  'account.plan.plus': 'Plano Plus',
  'account.plan.free': 'Plano gratuito',
  'account.endsOn': ({ locale, date }) => `Termina ${date}`,
  'account.endsSoon': 'Termina em breve',
  'account.summary.plus': 'Sua assinatura desbloqueia formatos avançados e entrega no Drive e Notion.',
  'account.summary.free': 'Faça upgrade para desbloquear formatos avançados e entrega no Drive e Notion.',
  'account.manageSubscription': 'Gerenciar assinatura',
  'account.upgradeToPlus': 'Fazer upgrade para o Plus',
  'account.destinations': 'Destinos',
  'account.connected': 'Conectado',
  'account.notConnected': 'Não conectado',

  'login.subtitle': 'Entre para desbloquear exportações avançadas e entrega no Drive e Notion',
  'login.googleOpening': 'Abrindo Google...',
  'login.googleContinue': 'Continuar com o Google',
  'login.emailPlaceholder': 'Digite seu e-mail',
  'login.emailHelper': 'Enviaremos um código de uso único.',
  'login.sendCode': 'Enviar código de login',
  'login.sending': 'Enviando...',
  'login.codeSentSuccess': 'Código enviado! Verifique seu e-mail.',
  'login.signedInSuccess': 'Conectado! Voltando ao painel.',
  'login.googleError': 'Não foi possível iniciar o login com o Google.',
  'login.otpHint': ({ locale, email }) => `Digite o código enviado para ${email}`,
  'login.otpPlaceholder': 'Digite o código de 6 dígitos',
  'login.verify': 'Verificar e entrar',
  'login.verifying': 'Verificando...',
  'login.useDifferentEmail': 'Usar outro e-mail',
  'login.backToDashboard': 'Voltar ao painel',

  'notice.notionPagesError': 'Não foi possível carregar as páginas do Notion. Tente atualizar.',
  'notice.driveConnectError': 'Não foi possível conectar o Google Drive. Tente novamente.',
  'notice.notionConnectError': 'Não foi possível conectar o Notion. Tente novamente.',
  'notice.driveDisconnected': 'Google Drive desconectado.',
  'notice.notionDisconnected': 'Notion desconectado.',
  'notice.notionDestinationMissingToken': 'Conecte o Notion antes de definir uma página de destino.',
  'notice.notionDestinationSet': ({ locale, title }) => `Destino do Notion definido: ${title}.`,
  'notice.notionDestinationReady': 'O destino do Notion está pronto.',
  'notice.notionDestinationError': 'Não foi possível definir o destino do Notion. Tente novamente.',
  'notice.signInToUpgrade': 'Entre para fazer upgrade.',
  'notice.checkoutError': 'Não foi possível iniciar o checkout. Tente novamente.',
  'notice.billingPortalError': 'Não foi possível abrir o portal de cobrança. Tente novamente.',
  'notice.signInToUnlock': 'Entre para desbloquear exportações avançadas.',
  'notice.trialsUsedUp': 'Seus testes grátis acabaram. Faça upgrade para continuar.',
  'notice.notionUnsupportedFormat': ({ locale, contentLabel, formats }) =>
    `As exportações do Notion para ${contentLabel} oferecem suporte a ${formats}.`,
  'notice.connectDriveToContinue': 'Conecte o Google Drive para continuar.',
  'notice.connectNotionToContinue': 'Conecte o Notion para continuar.',
  'notice.setNotionDestination': 'Defina uma página de destino do Notion para continuar.',
  'notice.noActiveTab': 'Nenhuma aba ativa encontrada.',
  'notice.copySuccess': ({ locale, contentLabel, trialMessage }) =>
    `Markdown de ${contentLabel} copiado para a área de transferência.${trialMessage ?? ''}`,
  'notice.copyFailed': 'Falha ao copiar. Tente novamente.',
  'notice.exportSuccess': ({ locale, contentLabel, destination, format, trialMessage }) =>
    `${contentLabel} exportado para ${destination} como ${format}.${trialMessage ?? ''}`,
  'notice.exportFailedDrive': 'Falha na exportação. Verifique a conexão do Drive e tente novamente.',
  'notice.exportFailedNotion': 'Falha na exportação. Verifique a conexão do Notion e o destino.',
  'notice.exportFailed': 'Falha na exportação.',
  'notice.notionSpecificFormat': 'Escolha um formato de exportação específico para a entrega no Notion.',
  'notice.exportStarted': 'Exportação iniciada. Você será avisado quando estiver pronta.',
  'notice.extractionFailed': 'Falha ao extrair o conteúdo. Certifique-se de estar em uma página do NotebookLM e que o conteúdo esteja visível.',
  'notice.contentScriptError': 'Erro ao comunicar com o script de conteúdo. Atualize a página e tente novamente.',
  'notice.signInToConnectDrive': 'Entre para conectar o Google Drive.',
  'notice.signInToConnectNotion': 'Entre para conectar o Notion.',

  'destination.driveRequiresPlus': 'As exportações para o Drive exigem conexão com o Google Drive e assinatura Plus.',
  'destination.notionRequiresPlus': 'As exportações para o Notion exigem conexão com o Notion e assinatura Plus.',
  'destination.localInstant': 'As exportações locais são instantâneas. Formatos avançados desbloqueiam com Plus.',
};

const FR_MESSAGES: Record<string, MessageValue> = {
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
  'common.uiLanguage': 'Langue de l’interface',
  'common.email': 'E-mail',
  'common.orUseEmail': 'ou utiliser l’e-mail',
  'common.exportDestination': 'Destination d’exportation',
  'common.exportToNotion': 'Exporter vers Notion',
  'common.copy': 'Copier',

  'header.signOutTitle': 'Se déconnecter',

  'export.section.quiz': 'Exports de quiz',
  'export.section.flashcards': 'Exports de fiches',
  'export.section.mindmap': 'Exports de cartes mentales',
  'export.section.note': 'Exports de notes',
  'export.section.report': 'Exports de rapports',
  'export.section.chat': 'Exports de chat',
  'export.section.datatable': 'Exports de tableaux de données',
  'export.section.source': 'Exports de sources',
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

  'content.quiz': 'Quiz',
  'content.flashcards': 'Fiches',
  'content.mindmap': 'Carte mentale',
  'content.note': 'Note',
  'content.report': 'Rapport',
  'content.chat': 'Chat',
  'content.source': 'Sources',
  'content.datatable': 'Tableau de données',

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

export const MESSAGES: Record<Locale, Record<string, MessageValue>> = {
  'en-US': EN_MESSAGES,
  'es-ES': ES_MESSAGES,
  'de-DE': DE_MESSAGES,
  'it-IT': IT_MESSAGES,
  'pt-BR': PT_MESSAGES,
  'fr-FR': FR_MESSAGES,
};

export const isLocale = (value?: string | null): value is Locale =>
  value === 'en-US' ||
  value === 'es-ES' ||
  value === 'de-DE' ||
  value === 'it-IT' ||
  value === 'pt-BR' ||
  value === 'fr-FR';

export type MessageKey = keyof typeof EN_MESSAGES;

export type MessageDescriptor = {
  key: MessageKey;
  params?: MessageParams;
};

export const formatMessageValue = (message: MessageValue, params: MessageParams) => {
  if (typeof message === 'function') {
    return message(params);
  }
  if (!params) {
    return message;
  }
  return message.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? '' : String(value);
  });
};

export const formatMessage = (locale: Locale, key: MessageKey, params?: MessageParams) => {
  const message = MESSAGES[locale]?.[key] ?? MESSAGES[DEFAULT_LOCALE][key];
  if (!message) {
    return key;
  }
  return formatMessageValue(message, { locale, ...params });
};
