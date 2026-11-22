/**
 * Light subtask routing.
 * Pure TypeScript (no React Native imports) so it can be unit-tested in isolation.
 *
 * Turns a phrase like "play despacito on spotify" into a structured subtask,
 * and splits multi-step requests like "open youtube and then search cats".
 * All tunables (trigger/filler words, separators, context timeout, URL templates)
 * come from light-config.ts.
 */
import { LIGHT_CONFIG } from './light-config';

export type SubtaskKind = 'play' | 'search' | 'login' | 'open';

export interface Subtask {
  kind: SubtaskKind;
  app?: string;
  query?: string;
}

export interface SubtaskContext {
  lastApp?: string;
  timestamp?: number;
}

const { mediaApps, triggerPhrases, multiStepSeparators, fillerWords } = LIGHT_CONFIG.subtasks;

// Phrases that mean "search" rather than "play". Kept local because config has only one trigger list.
const SEARCH_VERBS = ['search for', 'search', 'find', 'look up'];

// Phrases that mean "sign in" for the login subtask.
const LOGIN_PHRASES = ['login', 'log in', 'sign in'];

// Escapes regex metacharacters so config phrases are matched literally.
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Builds a regex alternation with longer phrases first, so "search for" wins over "search".
function alternation(phrases: string[]): string {
  return [...phrases]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');
}

const APP_ALT = alternation(mediaApps);

// Matches "on youtube" / "to spotify" (case-insensitive). Used to detect and strip an explicit app.
const APP_MENTION_SRC = `\\b(?:on|to)\\s+(${APP_ALT})\\b`;

// Returns the app for this request: explicit "on <app>" wins; otherwise a non-expired lastApp.
function resolveApp(text: string, context: SubtaskContext, now: number): string | undefined {
  const explicit = new RegExp(APP_MENTION_SRC, 'i').exec(text);
  if (explicit) return explicit[1].toLowerCase();

  // Context expires after the configured timeout. A missing timestamp cannot be verified, so treat it as expired.
  const expired =
    typeof context.timestamp !== 'number' ||
    now - context.timestamp > LIGHT_CONFIG.context.timeoutMs;
  if (!expired && context.lastApp && mediaApps.includes(context.lastApp)) {
    return context.lastApp;
  }
  return undefined;
}

/**
 * Parses one (already split) user phrase into a subtask.
 * Returns null when the phrase is not a recognised subtask or no app can be determined.
 */
export function parseSubtask(
  text: string,
  context: SubtaskContext,
  now: number = Date.now(),
): Subtask | null {
  const cleaned = text.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!cleaned) return null;

  // "open youtube" / "launch spotify"
  const openMatch = cleaned.match(new RegExp(`^(?:open|launch|start)\\s+(${APP_ALT})$`));
  if (openMatch) {
    return { kind: 'open', app: openMatch[1] };
  }

  // Remove the explicit app mention so the remaining text is only the command/query.
  const withoutApp = cleaned.replace(new RegExp(APP_MENTION_SRC, 'gi'), ' ').trim();
  const app = resolveApp(cleaned, context, now);

  // "login" / "log in" / "sign in" (optionally "to <app>") — needs a known app.
  if (LOGIN_PHRASES.includes(withoutApp)) {
    return app ? { kind: 'login', app } : null;
  }

  // Play/search needs a trigger phrase and a known app.
  const triggerRe = new RegExp(`(?:^|\\s)(?:${alternation(triggerPhrases)})(?=\\s|$)`, 'i');
  if (!triggerRe.test(withoutApp) || !app) return null;

  const kind: 'play' | 'search' = new RegExp(
    `(?:^|\\s)(?:${alternation(SEARCH_VERBS)})(?=\\s|$)`,
    'i',
  ).test(withoutApp)
    ? 'search'
    : 'play';

  // Strip trigger phrases from the text, then trim filler words from the start and end only.
  const stripped = withoutApp
    .replace(new RegExp(`(?:^|\\s)(?:${alternation(triggerPhrases)})(?=\\s|$)`, 'gi'), ' ')
    .trim();
  const tokens = stripped.split(' ').filter(Boolean);
  while (tokens.length && fillerWords.includes(tokens[0])) tokens.shift();
  while (tokens.length && fillerWords.includes(tokens[tokens.length - 1])) tokens.pop();

  const query = tokens.join(' ');
  return query ? { kind, app, query } : { kind, app };
}

/**
 * Builds the search URL for an app from the config template.
 * {query} is replaced with the encodeURIComponent-ed query. Returns null for unknown apps.
 */
export function buildSearchUrl(app: string, query: string): string | null {
  const template = (LIGHT_CONFIG.search as Record<string, unknown>)[app];
  if (typeof template !== 'string') return null;
  return template.split('{query}').join(encodeURIComponent(query.trim()));
}

/**
 * Splits a multi-step request on the configured separators (longest first).
 * Returns [text] unchanged when there is no separator or any resulting part would be empty.
 */
export function splitMultiStep(text: string): string[] {
  const trimmed = text.trim();
  const separatorRe = new RegExp(`\\s+(?:${alternation(multiStepSeparators)})\\s+`, 'i');
  const parts = trimmed.split(separatorRe).map((p) => p.trim());
  if (parts.length < 2 || parts.some((p) => p === '')) return [text];
  return parts;
}
