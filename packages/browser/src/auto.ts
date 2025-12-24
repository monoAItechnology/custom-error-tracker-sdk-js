/**
 * @monoai/error-tracker-browser - Auto-initialization Entry Point
 *
 * このモジュールをインポートすると、error-tracker.config.ts の設定で
 * 自動的に Error Tracker が初期化されます。
 *
 * 使用例:
 * ```typescript
 * // インポートするだけで初期化完了
 * import '@monoai/error-tracker-browser/auto';
 *
 * // 手動キャプチャも可能
 * import { captureMessage } from '@monoai/error-tracker-browser';
 * captureMessage('Something happened');
 * ```
 */

import { init } from './index';
import config from '@monoai/error-tracker-config';

// 設定ファイルから自動初期化
init(config);

// 初期化完了をログ出力（debug モードの場合）
if (config.debug) {
  console.debug('[ErrorTracker] Auto-initialized with config:', {
    dsn: config.dsn,
    appId: config.appId,
    environment: config.environment,
  });
}
