/**
 * Error Tracker SDK Configuration
 *
 * このファイルを編集して、エラートラッカーの設定を行ってください。
 * SDKをインポートするだけで、この設定が自動的に適用されます。
 *
 * 使用例:
 * ```javascript
 * // 設定ファイルを編集後、インポートするだけで自動初期化
 * import '@monoai/error-tracker-browser/auto';
 *
 * // エラーは自動的にキャプチャされます
 * // 手動送信も可能:
 * import { captureMessage } from '@monoai/error-tracker-browser';
 * captureMessage('Something happened');
 * ```
 */

/** @type {import('@monoai/error-tracker-core').ErrorTrackerOptions} */
const config = {
  /**
   * API エンドポイント URL
   * Azure Functions の URL を指定してください
   */
  dsn: 'https://your-function-app.azurewebsites.net',

  /**
   * アプリケーション ID
   * エラーログを識別するための一意の名前
   */
  appId: 'my-app',

  /**
   * Git コミットハッシュ
   * ビルド時に環境変数から取得することを推奨
   */
  commitHash: 'development',

  /**
   * 実行環境
   * 'Production' | 'Staging' | 'Development'
   */
  environment: 'Development',

  /**
   * (オプション) 自動エラーキャプチャ
   * true: window.onerror, unhandledrejection を自動フック
   * デフォルト: true
   */
  autoCapture: true,

  /**
   * (オプション) デバッグモード
   * true: コンソールにSDKのログを出力
   * デフォルト: false
   */
  debug: false,

  /**
   * (オプション) 全イベントに付与するタグ
   */
  // tags: {
  //   version: '1.0.0',
  // },

  /**
   * (オプション) 送信前フック
   * イベントを加工したり、null を返してドロップ可能
   */
  // beforeSend: (event) => {
  //   // センシティブ情報をマスク
  //   return event;
  // },
};

export default config;
