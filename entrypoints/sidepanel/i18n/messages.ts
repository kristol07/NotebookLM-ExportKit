export type Locale = 'en' | 'es';

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

export type MessageParams = Record<string, string | number | undefined> & {
  locale: Locale;
};

type MessageValue = string | ((params: MessageParams) => string);

const pluralize = (locale: Locale, count: number, forms: { one: string; other: string }) => {
  const rule = new Intl.PluralRules(locale).select(count);
  return rule === 'one' ? forms.one : forms.other;
};

export const MESSAGES: Record<Locale, Record<string, MessageValue>> = {
  en: {
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
  },
  es: {
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
  },
};

export const isLocale = (value?: string | null): value is Locale => value === 'en' || value === 'es';

export type MessageKey = keyof typeof MESSAGES.en;

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
