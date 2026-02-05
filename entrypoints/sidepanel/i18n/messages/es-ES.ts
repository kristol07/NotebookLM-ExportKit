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

export const ES_MESSAGES: Record<string, MessageValue> = {
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
  'common.settings': 'Ajustes',
  'common.uiLanguage': 'Idioma',
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
  'account.supportTitle': 'Contáctanos',
  'account.supportEmail': 'notebooklm.exportkit@gmail.com',

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

