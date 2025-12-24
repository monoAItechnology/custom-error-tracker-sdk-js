# Error Tracker SDK

Sentry-like error tracking SDK for JavaScript/TypeScript applications.

## Packages

| Package | Description |
|---------|-------------|
| `@monoai/error-tracker-core` | Core types and utilities |
| `@monoai/error-tracker-browser` | Browser SDK with automatic error capture |
| `@monoai/error-tracker-node` | Node.js SDK with Express middleware |

## Installation

```bash
# Browser applications
npm install @monoai/error-tracker-browser

# Node.js applications
npm install @monoai/error-tracker-node
```

## Usage

### Browser

```javascript
import { init, captureMessage } from '@monoai/error-tracker-browser';

// Initialize as early as possible
init({
  dsn: 'https://your-functions-url.azurewebsites.net',
  appId: 'my-web-app',
  commitHash: 'abc123',
  environment: 'Production'
});

// Errors are now captured automatically via window.onerror
// and unhandledrejection events

// Manual capture
captureMessage('User completed checkout', 'Warning');

// Set user context
setUser({ id: 'user-123', email: 'user@example.com' });

// Add tags
setTag('version', '1.0.0');
```

### CDN Usage

```html
<script src="https://unpkg.com/@monoai/error-tracker-browser/dist/browser/error-tracker.min.js"></script>
<script>
  ErrorTracker.init({
    dsn: 'https://your-functions-url.azurewebsites.net',
    appId: 'my-web-app',
    commitHash: 'abc123',
    environment: 'Production'
  });
</script>
```

### Node.js

```javascript
import { init, captureMessage } from '@monoai/error-tracker-node';

// Initialize as early as possible
init({
  dsn: 'https://your-functions-url.azurewebsites.net',
  appId: 'my-api',
  commitHash: 'abc123',
  environment: 'Production'
});

// Errors are now captured automatically via
// process.on('uncaughtException') and process.on('unhandledRejection')

// Manual capture
captureMessage('Server started', 'Warning');
```

### Express Middleware

```javascript
import express from 'express';
import { init } from '@monoai/error-tracker-node';
import { errorHandler, requestHandler } from '@monoai/error-tracker-node/express';

init({
  dsn: 'https://your-functions-url.azurewebsites.net',
  appId: 'my-api',
  commitHash: 'abc123',
  environment: 'Production'
});

const app = express();

// Add request context (optional, before routes)
app.use(requestHandler());

// Your routes
app.get('/api/users', async (req, res) => {
  const users = await getUsers();
  res.json(users);
});

// Error handler (must be last)
app.use(errorHandler());

app.listen(3000);
```

## Auto-initialization (設定ファイル方式)

設定ファイルを編集し、インポートするだけで自動的に初期化する方法です。

### 1. 設定ファイルを編集

`error-tracker.config.js` を編集して、エンドポイントやアプリ情報を設定します。

```javascript
// error-tracker.config.js
const config = {
  // API エンドポイント URL
  dsn: 'https://your-functions-url.azurewebsites.net',

  // アプリケーション ID
  appId: 'my-app',

  // Git コミットハッシュ（ビルド時に環境変数から取得推奨）
  commitHash: process.env.COMMIT_HASH || 'development',

  // 実行環境
  environment: 'Production',

  // 自動エラーキャプチャ（デフォルト: true）
  autoCapture: true,

  // デバッグモード（デフォルト: false）
  debug: false,
};

export default config;
```

### 2. インポートするだけで初期化

```javascript
// Browser - インポートするだけで自動初期化
import '@monoai/error-tracker-browser/auto';

// Node.js - インポートするだけで自動初期化
import '@monoai/error-tracker-node/auto';

// 以降、エラーは自動的にキャプチャされます
```

### 3. 手動キャプチャも併用可能

```javascript
import '@monoai/error-tracker-browser/auto';
import { captureMessage, captureException } from '@monoai/error-tracker-browser';

// 手動でメッセージを送信
captureMessage('User completed checkout', 'Warning');

// 手動で例外を送信
try {
  riskyOperation();
} catch (error) {
  captureException(error);
}
```

### 注意事項

- 設定変更後は SDK の再ビルド（`npm run build`）が必要です
- `commitHash` はビルドパイプラインで環境変数から注入することを推奨します

## Configuration Options

```typescript
interface ErrorTrackerOptions {
  // Required
  dsn: string;           // API endpoint URL
  appId: string;         // Application identifier
  commitHash: string;    // Git commit hash
  environment: 'Production' | 'Staging' | 'Development';

  // Optional
  apiKey?: string;       // API key for authenticated endpoints
  autoCapture?: boolean; // Enable automatic error capture (default: true)
  debug?: boolean;       // Enable debug logging (default: false)
  tags?: Record<string, string>;  // Default tags for all events
  user?: UserInfo;       // Default user info

  // Advanced
  beforeSend?: (event: ErrorEvent) => ErrorEvent | null | Promise<ErrorEvent | null>;
}
```

## API Reference

### Common Functions

| Function | Description |
|----------|-------------|
| `init(options)` | Initialize the SDK |
| `captureException(error, level?)` | Capture an exception |
| `captureMessage(message, level?)` | Capture a message |
| `setUser(user)` | Set user context |
| `setTag(key, value)` | Set a tag |
| `setTags(tags)` | Set multiple tags |
| `setExtra(key, value)` | Set extra context |
| `setExtras(extras)` | Set multiple extras |
| `close()` | Close the SDK and cleanup |

### Browser-specific

- Automatic capture of `window.onerror` and `unhandledrejection`
- Offline queue with localStorage persistence
- Beacon API for page unload scenarios

### Node.js-specific

| Function | Description |
|----------|-------------|
| `flush(timeout?)` | Flush pending events |
| `errorHandler(options?)` | Express error middleware |
| `requestHandler()` | Express request middleware |
| `asyncHandler(fn)` | Wrap async route handlers |

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Build specific package
npm run build:core
npm run build:browser
npm run build:node
```
