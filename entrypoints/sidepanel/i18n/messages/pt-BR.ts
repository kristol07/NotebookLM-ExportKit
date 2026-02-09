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

export const PT_MESSAGES: Record<string, MessageValue> = {
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
  'common.settings': 'Configurações',
  'common.uiLanguage': 'Idioma',
  'common.email': 'E-mail',
  'common.orUseEmail': 'ou usar e-mail',
  'common.exportDestination': 'Destino de exportação',
  'common.exportToNotion': 'Exportar para o Notion',
  'common.copy': 'Copiar',
  'whatsNew.badge': 'Novo',
  'whatsNew.title': 'Novidades',
  'whatsNew.subtitle': 'Recursos mais recentes desta versao',
  'whatsNew.feature.sideDeckExport': 'Suporte para exportacao de slide deck',
  'whatsNew.feature.dataTableSources': 'Exportacao de tabela de dados aprimorada com lista de fontes',
  'whatsNew.feature.reportHtmlExport': 'Suporte para exportacao de relatorios em HTML',
  'whatsNew.feature.chatHtmlExport': 'Suporte para exportacao de chat em HTML',
  'whatsNew.feature.infographicExport': 'Novas exportacoes de infograficos para PNG, HTML, PDF e Notion',
  'whatsNew.feature.videoOverviewExport': 'Novas exportacoes de visao geral de video para MP4, audio WAV e ZIP de quadros',
  'whatsNew.action.gotIt': 'Entendi',

  'header.signOutTitle': 'Sair',

  'export.section.quiz': 'Exportações de quiz',
  'export.section.flashcards': 'Exportações de flashcards',
  'export.section.mindmap': 'Exportações de mapa mental',
  'export.section.note': 'Exportações de notas',
  'export.section.report': 'Exportações de relatórios',
  'export.section.chat': 'Exportações de chat',
  'export.section.datatable': 'Exportações de tabela de dados',
  'export.section.source': 'Exportações de fontes',
  'export.section.slidedeck': 'Exportações de slide deck',
  'export.section.infographic': 'Exportações de infográficos',
  'export.section.videoOverview': 'Exportações de visão geral de vídeo',
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
  'export.notionLayout.slidedeck': 'Documento único com imagens de slides e alternância de texto alternativo por slide',
  'export.notionLayout.infographic': 'Documento único com imagem do infográfico e alternância de detalhes',
  'export.notionLayout.videoOverview': 'A entrega no Notion não é compatível com pacotes de visão geral de vídeo',

  'content.quiz': 'Quiz',
  'content.flashcards': 'Flashcards',
  'content.mindmap': 'Mapa mental',
  'content.note': 'Nota',
  'content.report': 'Relatório',
  'content.chat': 'Chat',
  'content.source': 'Fontes',
  'content.datatable': 'Tabela de dados',
  'content.slidedeck': 'Slide deck',
  'content.infographic': 'Infográfico',
  'content.videoOverview': 'Visão geral de vídeo',

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
  'account.supportTitle': 'Fale conosco',
  'account.supportEmail': 'notebooklm.exportkit@gmail.com',

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
    `${contentLabel} copiado para a área de transferência.${trialMessage ?? ''}`,
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

