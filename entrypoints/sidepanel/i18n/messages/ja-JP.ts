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

export const JA_MESSAGES: Record<string, MessageValue> = {
  'app.name': 'NotebookLM ExportKit',
  'common.account': 'アカウント',
  'common.signIn': 'サインイン',
  'common.signOut': 'サインアウト',
  'common.close': '閉じる',
  'common.back': '戻る',
  'common.upgrade': 'アップグレード',
  'common.connect': '接続',
  'common.disconnect': '切断',
  'common.changeAccount': 'アカウントを変更',
  'common.changeWorkspace': 'ワークスペースを変更',
  'common.refreshList': '一覧を更新',
  'common.ready': '準備完了',
  'common.needsSetup': '要セットアップ',
  'common.done': '完了',
  'common.unlocked': '解除済み',
  'common.googleDrive': 'Google Drive',
  'common.notion': 'Notion',
  'common.thisDevice': 'このデバイス',
  'common.downloads': 'ダウンロード',
  'common.uploadingToDrive': 'Google Drive にアップロード中',
  'common.signedIn': 'サインイン済み',
  'common.language': '言語',
  'common.settings': '設定',
  'common.uiLanguage': '言語',
  'common.email': 'メール',
  'common.orUseEmail': 'またはメールを使用',
  'common.exportDestination': 'エクスポート先',
  'common.exportToNotion': 'Notion にエクスポート',
  'common.copy': 'コピー',
  'whatsNew.badge': '新機能',
  'whatsNew.title': '新着情報',
  'whatsNew.subtitle': 'このバージョンで追加された機能',
  'whatsNew.feature.sideDeckExport': 'スライドデッキのエクスポートに対応',
  'whatsNew.feature.dataTableSources': 'ソース一覧付きでデータテーブルのエクスポートを改善',
  'whatsNew.feature.reportHtmlExport': 'レポートの HTML エクスポートに対応',
  'whatsNew.feature.chatHtmlExport': 'チャットの HTML エクスポートに対応',
  'whatsNew.feature.infographicExport': 'インフォグラフィックを PNG/HTML/PDF、画像コピー、Notion へエクスポート可能に',
  'whatsNew.action.gotIt': '確認しました',

  'header.signOutTitle': 'サインアウト',

  'export.section.quiz': 'クイズのエクスポート',
  'export.section.flashcards': 'フラッシュカードのエクスポート',
  'export.section.mindmap': 'マインドマップのエクスポート',
  'export.section.note': 'ノートのエクスポート',
  'export.section.report': 'レポートのエクスポート',
  'export.section.chat': 'チャットのエクスポート',
  'export.section.datatable': 'データテーブルのエクスポート',
  'export.section.source': 'ソースのエクスポート',
  'export.section.slidedeck': 'スライドデッキのエクスポート',
  'export.section.infographic': 'インフォグラフィックのエクスポート',
  'export.option.clipboard': 'クリップボード',
  'export.option.copyImage': '画像をコピー',
  'export.hint.notion': 'Notion のエクスポートはネイティブレイアウトを使用します。',
  'export.comingSoon': '近日公開',
  'export.comingSoonDetail': '動画・音声の概要を文字起こし/スライドへ',
  'export.pdfQualityTitle': 'PDF 品質',
  'export.pdfQualitySize': 'サイズ優先',
  'export.pdfQualityClarity': '画質優先',
  'export.supportedBy': ({ apps }) => {
    if (!apps || typeof apps !== 'string') {
      return '対応';
    }
    return `対応: ${apps}`;
  },
  'export.destinationHint.drive': 'Drive エクスポートには Google Drive の接続と Plus サブスクリプションが必要です。',
  'export.destinationHint.notion': 'Notion エクスポートには Notion の接続と Plus サブスクリプションが必要です。',
  'export.destinationHint.download': 'ローカルのエクスポートは即時です。高度な形式は Plus で解除されます。',

  'export.notionLayout.quiz': 'コールアウトの質問、選択肢の箇条書き、ヒント/回答のトグル、理由のセクション',
  'export.notionLayout.flashcards': '青い裏面メモ付きのトグルカード',
  'export.notionLayout.mindmap': 'セクション見出しとネストされた箇条書き + トグル',
  'export.notionLayout.datatable': '行セル付きのデータテーブル',
  'export.notionLayout.note': '段落、テーブル、コードブロックを含むリッチドキュメント',
  'export.notionLayout.report': '見出し、段落、テーブル、コードブロックを含むリッチレポート',
  'export.notionLayout.chat': '役割見出しと段落、テーブル、コードブロック',
  'export.notionLayout.source': '概要、主要トピック、構造化コンテンツを含むソース詳細',
  'export.notionLayout.slidedeck': '各スライドの代替テキストトグル付き、画像を1つのドキュメントに配置',
  'export.notionLayout.infographic': 'インフォグラフィック画像と詳細トグルを1つのドキュメントに配置',

  'content.quiz': 'クイズ',
  'content.flashcards': 'フラッシュカード',
  'content.mindmap': 'マインドマップ',
  'content.note': 'ノート',
  'content.report': 'レポート',
  'content.chat': 'チャット',
  'content.source': 'ソース',
  'content.datatable': 'データテーブル',
  'content.slidedeck': 'スライドデッキ',
  'content.infographic': 'インフォグラフィック',

  'drive.setup': 'Drive のセットアップ',
  'drive.step.signIn': '1. アカウントにサインイン',
  'drive.step.upgrade': '2. Plus にアップグレード',
  'drive.step.connect': '3. Google Drive を接続',
  'drive.note.subscription': 'サブスクリプションはこのアカウントに紐づきます。',
  'drive.note.plus': 'Drive 配信は Plus で利用可能です。',
  'drive.note.connectedAs': ({ email }) => `${email} として接続済み`,
  'drive.note.chooseAccount': 'Drive 配信用に Google アカウントを選択してください。',

  'notion.setup': 'Notion のセットアップ',
  'notion.step.signIn': '1. アカウントにサインイン',
  'notion.step.upgrade': '2. Plus にアップグレード',
  'notion.step.connect': '3. Notion を接続',
  'notion.step.destination': '4. 保存先ページを選択',
  'notion.note.subscription': 'サブスクリプションはこのアカウントに紐づきます。',
  'notion.note.plus': 'Notion 配信は Plus で利用可能です。',
  'notion.note.connectedTo': ({ workspace }) => `${workspace} に接続済み。`,
  'notion.note.authorizeWorkspace': 'エクスポート先のワークスペースを認可してください。',
  'notion.note.destinationSet': ({ preview }) => `保存先を設定しました (${preview}).`,
  'notion.note.destinationPick': 'NotebookLM ExportKit データベースを配置するページを選択してください。',
  'notion.pages.choose': 'Notion ページを選択',
  'notion.pages.none': 'ページが見つかりません',
  'notion.saving': '保存先を保存中...',

  'upgrade.banner.title': 'Plus プラン',
  'upgrade.banner.note': '高度な形式に加え、Drive と Notion 配信を解除します。',
  'upgrade.modal.title': 'Plus にアップグレード',
  'upgrade.modal.subtitle.drive': 'Google Drive 配信と高度な形式を有効にします。',
  'upgrade.modal.subtitle.notion': 'Notion 配信と高度な形式を有効にします。',
  'upgrade.modal.subtitle.format': '高度なエクスポート形式をすぐに解除します。',
  'upgrade.modal.subtitle.general': '高度な形式に加え、Drive と Notion 配信を解除します。',
  'upgrade.modal.benefit.formats': '学習ワークフロー向けの高度なエクスポート形式。',
  'upgrade.modal.benefit.drive': 'エクスポートを Google Drive に直接配信。',
  'upgrade.modal.benefit.notion': 'エクスポートを Notion ページに送信。',
  'upgrade.modal.trialNote': 'Plus は試用後、月額 $2.99 です。決済は creem.io が安全に管理します。',
  'upgrade.modal.checkout': 'チェックアウトへ進む',
  'upgrade.modal.manage': 'サブスクリプションを管理',

  'trial.free': '無料トライアル',
  'trial.exportsLeft': ({ count }) => {
    if (typeof count !== 'number') {
      return '';
    }
    if (count === 0) {
      return 'エクスポート残りなし';
    }
    return `残り ${count} 件`;
  },
  'trial.exportsLeftShort': ({ count }) => {
    if (typeof count !== 'number') {
      return '';
    }
    return `${count} 件`;
  },
  'trial.used': ({ count }) => {
    if (typeof count !== 'number') {
      return 'トライアルを使用しました。';
    }
    return `トライアルを使用しました。残り ${count} 件。`;
  },
  'trial.statusChecking': 'エクスポート数を確認中...',
  'trial.usedUp': '無料トライアルのエクスポートを使い切りました。',
  'trial.freeLeft': ({ count }) => {
    if (typeof count !== 'number') {
      return '無料トライアル。';
    }
    return `無料トライアル: 残り ${count} 件。`;
  },

  'account.title': 'アカウント',
  'account.plan.plus': 'Plus プラン',
  'account.plan.free': '無料プラン',
  'account.endsOn': ({ date }) => `終了日 ${date}`,
  'account.endsSoon': 'まもなく終了',
  'account.summary.plus': 'サブスクリプションにより、高度なエクスポート形式と Drive / Notion 配信が利用できます。',
  'account.summary.free': 'アップグレードして、高度なエクスポート形式と Drive / Notion 配信を解除します。',
  'account.manageSubscription': 'サブスクリプションを管理',
  'account.upgradeToPlus': 'Plus にアップグレード',
  'account.destinations': '送信先',
  'account.connected': '接続済み',
  'account.notConnected': '未接続',
  'account.supportTitle': 'お問い合わせ',
  'account.supportEmail': 'notebooklm.exportkit@gmail.com',

  'login.subtitle': 'サインインして高度なエクスポートと Drive / Notion 配信を解除',
  'login.googleOpening': 'Google を開いています...',
  'login.googleContinue': 'Google で続行',
  'login.emailPlaceholder': 'メールアドレスを入力',
  'login.emailHelper': 'ワンタイムコードを送信します。',
  'login.sendCode': 'ログインコードを送信',
  'login.sending': '送信中...',
  'login.codeSentSuccess': 'コードを送信しました。メールを確認してください。',
  'login.signedInSuccess': 'サインインしました。ダッシュボードに戻ります。',
  'login.googleError': 'Google サインインを開始できません。',
  'login.otpHint': ({ email }) => `${email} に送信されたコードを入力`,
  'login.otpPlaceholder': '6桁コードを入力',
  'login.verify': '確認してログイン',
  'login.verifying': '確認中...',
  'login.useDifferentEmail': '別のメールを使用',
  'login.backToDashboard': 'ダッシュボードに戻る',

  'notice.notionPagesError': 'Notion ページを読み込めませんでした。更新してください。',
  'notice.driveConnectError': 'Google Drive に接続できませんでした。もう一度お試しください。',
  'notice.notionConnectError': 'Notion に接続できませんでした。もう一度お試しください。',
  'notice.driveDisconnected': 'Google Drive の接続を解除しました。',
  'notice.notionDisconnected': 'Notion の接続を解除しました。',
  'notice.notionDestinationMissingToken': '保存先ページを設定する前に Notion を接続してください。',
  'notice.notionDestinationSet': ({ title }) => `Notion の保存先を設定しました: ${title}.`,
  'notice.notionDestinationReady': 'Notion の保存先が準備できました。',
  'notice.notionDestinationError': 'Notion の保存先を設定できませんでした。もう一度お試しください。',
  'notice.signInToUpgrade': 'アップグレードするにはサインインしてください。',
  'notice.checkoutError': 'チェックアウトを開始できませんでした。もう一度お試しください。',
  'notice.billingPortalError': '請求ポータルを開けませんでした。もう一度お試しください。',
  'notice.signInToUnlock': '高度なエクスポートを解除するにはサインインしてください。',
  'notice.trialsUsedUp': '無料トライアルは使い切りました。アップグレードして続行してください。',
  'notice.notionUnsupportedFormat': ({ contentLabel, formats }) =>
    `Notion での ${contentLabel} エクスポートは ${formats} に対応しています。`,
  'notice.connectDriveToContinue': '続行するには Google Drive を接続してください。',
  'notice.connectNotionToContinue': '続行するには Notion を接続してください。',
  'notice.setNotionDestination': '続行するには Notion の保存先ページを設定してください。',
  'notice.noActiveTab': 'アクティブなタブが見つかりません。',
  'notice.copySuccess': ({ contentLabel, trialMessage }) =>
    `${contentLabel} をクリップボードにコピーしました。${trialMessage ?? ''}`,
  'notice.copyFailed': 'コピーに失敗しました。もう一度お試しください。',
  'notice.exportSuccess': ({ contentLabel, destination, format, trialMessage }) =>
    `${destination} に ${format} 形式で ${contentLabel} をエクスポートしました。${trialMessage ?? ''}`,
  'notice.exportFailedDrive': 'エクスポートに失敗しました。Drive の接続を確認して再試行してください。',
  'notice.exportFailedNotion': 'エクスポートに失敗しました。Notion の接続と保存先を確認してください。',
  'notice.exportFailed': 'エクスポートに失敗しました。',
  'notice.notionSpecificFormat': 'Notion 配信には特定のエクスポート形式を選択してください。',
  'notice.exportStarted': 'エクスポートを開始しました。準備ができ次第、通知します。',
  'notice.extractionFailed': '内容の抽出に失敗しました。NotebookLM のページで内容が表示されていることを確認してください。',
  'notice.contentScriptError': 'コンテンツスクリプトとの通信でエラーが発生しました。ページを更新して再試行してください。',
  'notice.signInToConnectDrive': 'Google Drive を接続するにはサインインしてください。',
  'notice.signInToConnectNotion': 'Notion を接続するにはサインインしてください。',

  'destination.driveRequiresPlus': 'Drive エクスポートには Google Drive の接続と Plus サブスクリプションが必要です。',
  'destination.notionRequiresPlus': 'Notion エクスポートには Notion の接続と Plus サブスクリプションが必要です。',
  'destination.localInstant': 'ローカルのエクスポートは即時です。高度な形式は Plus で解除されます。',
};
