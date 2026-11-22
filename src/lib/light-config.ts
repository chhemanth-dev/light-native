/**
 * Light tunable parameters.
 * Change values here instead of editing the assistant logic.
 */

export const LIGHT_CONFIG = {
  ai: {
    // Light AI actions are only executed when confidence is above this value.
    confidenceThreshold: 0.7,
  },

  history: {
    // Maximum number of chat history entries kept in memory.
    maxLength: 20,
  },

  context: {
    // Conversation context (last app / last query) expires after this many ms of inactivity.
    timeoutMs: 5 * 60 * 1000,
  },

  apps: {
    // Android package names for media apps.
    packages: {
      youtube: 'com.google.android.youtube',
      spotify: 'com.spotify.music',
    },
  },

  search: {
    // URL templates; {query} is replaced with the URL-encoded search text.
    youtube: 'https://www.youtube.com/results?search_query={query}',
    spotify: 'https://open.spotify.com/search/{query}',
  },

  login: {
    // Web sign-in pages opened for the "login" subtask. Credentials are never handled by Light.
    youtube: 'https://accounts.google.com/ServiceLogin',
    spotify: 'https://accounts.spotify.com/login',
  },

  subtasks: {
    // Apps that subtask routing understands.
    mediaApps: ['youtube', 'spotify'],
    // Phrases that start a play/search request.
    triggerPhrases: ['play', 'search for', 'search', 'find', 'look up', 'listen to', 'song'],
    // Separators for multi-step requests ("open youtube and then search cats").
    multiStepSeparators: ['and then', 'then', 'and'],
    // Words removed from the start and end of extracted queries.
    fillerWords: ['play', 'search', 'for', 'the', 'a', 'some', 'song', 'songs', 'video', 'music'],
  },

  // Max screen-control steps per task. Must be enforced by the caller (task runner).
  screenMaxSteps: 25,

  // Timeout for each single screen-control action.
  screenActionTimeoutMs: 5000,

  // How long screen access stays on after the user taps the floating orb. Screen reading is never allowed outside this window.
  screenSessionMs: 60000,

  // Target text containing any of these needs explicit user confirmation before Light acts.
  screenConfirmKeywords: ['purchase', 'buy', 'pay', 'checkout', 'delete', 'remove account', 'send money', 'transfer', 'confirm payment'],
};
