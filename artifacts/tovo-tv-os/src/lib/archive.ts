/**
 * Strict private routing validator wrapper utility.
 * Sanitizes input tokens before passing downstream to your running API wrapper instance.
 */
export function sanitizeAssetToken(token: string): string {
  if (!token) return '272'; // Fallback to safe structural identifier if parameter is missing

  // Strip special symbols or external absolute URI hooks to protect backend parsing blocks
  return token.replace(/[^a-zA-Z0-9]/g, '').trim();
}

/**
 * Validates tracking keys against internal environment routes.
 */
export const BACKEND_CONFIG = {
  endpoint: 'http://localhost:3000/api/route-stream',
  allowedProviders: ['vidsrc', 'embedcc', 'embedsu'] as const
};
