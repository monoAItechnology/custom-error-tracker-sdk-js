/**
 * Error Tracker SDK - Stack Trace Parsing Utilities
 */

import type { SourceContext } from '../types';

// Stack trace patterns for different environments
const STACK_PATTERNS = [
  // Chrome/V8: "at functionName (file.js:10:5)" or "at file.js:10:5"
  /at\s+(?:(.+?)\s+\()?((?:file|https?|webpack|app):\/\/[^)]+|\/[^)]+):(\d+):(\d+)\)?/,
  // Chrome/V8 without protocol: "at functionName (/path/to/file.js:10:5)"
  /at\s+(?:(.+?)\s+\()?([^()]+):(\d+):(\d+)\)?/,
  // Firefox/Safari: "functionName@file.js:10:5"
  /(.+)?@((?:file|https?|webpack|app):\/\/[^:]+|[^@:]+):(\d+):(\d+)/,
];

// Paths to skip when parsing stack traces
const SKIP_PATHS = [
  'node_modules',
  'internal/',
  '<anonymous>',
  'webpack/bootstrap',
  '__webpack_require__',
];

/**
 * Parse a stack trace string and extract the first relevant source context
 */
export function parseStackTrace(stack: string | undefined): SourceContext | undefined {
  if (!stack) return undefined;

  const lines = stack.split('\n');

  for (const line of lines) {
    // Skip empty lines and error message lines
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('Error:')) {
      continue;
    }

    for (const pattern of STACK_PATTERNS) {
      const match = trimmedLine.match(pattern);
      if (match) {
        const [, functionName, fileName, lineNumber, columnNumber] = match;

        // Skip internal/library frames
        if (shouldSkipFrame(fileName)) {
          continue;
        }

        return {
          functionName: cleanFunctionName(functionName),
          fileName: normalizeFilePath(fileName),
          lineNumber: parseInt(lineNumber, 10),
          columnNumber: parseInt(columnNumber, 10),
        };
      }
    }
  }

  return undefined;
}

/**
 * Check if a stack frame should be skipped
 */
function shouldSkipFrame(fileName: string | undefined): boolean {
  if (!fileName) return true;
  return SKIP_PATHS.some((path) => fileName.includes(path));
}

/**
 * Clean up function name
 */
function cleanFunctionName(name: string | undefined): string | undefined {
  if (!name) return undefined;
  // Remove 'Object.' prefix, 'async' prefix, etc.
  return name
    .replace(/^Object\./, '')
    .replace(/^async\s+/, '')
    .trim() || undefined;
}

/**
 * Normalize file path for consistent reporting
 */
function normalizeFilePath(filePath: string | undefined): string | undefined {
  if (!filePath) return undefined;

  let normalized = filePath
    // Remove protocol prefixes
    .replace(/^file:\/\//, '')
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^webpack:\/\/[^/]*/, '')
    .replace(/^app:\/\//, '')
    // Normalize path separators
    .replace(/\\/g, '/');

  // Remove common deployment path prefixes
  const prefixes = [
    '/home/site/wwwroot/',
    '/var/task/',
    '/app/',
    '/src/',
    './',
  ];

  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length);
      break;
    }
  }

  // Remove leading slash if present
  if (normalized.startsWith('/')) {
    normalized = normalized.slice(1);
  }

  return normalized || undefined;
}
