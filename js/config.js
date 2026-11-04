// Every site tunable lives here. Screens and data code read these; nothing else is hard-coded.
export const CONFIG = {
  dataUrl: './data.json',
  sampleUrl: './sample-data.json',
  schemaVersion: 1,
  fetchTimeoutMs: 10000,
  cacheKey: 'paperbot:data:v1',
  timeZone: 'America/Los_Angeles',
  tzLabel: 'PT',
  // Stale detection: the last expected run is the most recent run day at runHourPT.
  runHourPT: 14,
  runDays: [1, 2, 3, 4, 5],          // 0 = Sunday
  staleGraceHours: 3,
  staleRedDays: 3,
  holidays: [],                      // 'YYYY-MM-DD' market holidays (no run expected)
  tradesPageSize: 50,
  thinkingSort: 'absZ',              // absZ | symbol
  signalBadges: ['TAKEN', 'BLOCKED', 'FILTERED'], // the "Signals" filter on Bot's Thinking
  priceSmallDecimals: 4,             // prices under 1 (crypto)
  smallSigFigs: 4,                   // condition/indicator values under 1: significant figures
  priceDecimals: 2,
  pctDecimals: 2,
  stopPct: 0.05,                     // full width of the stop-distance bar
  badgeTones: { TAKEN: 'green', BLOCKED: 'red', HOLDING: 'blue', FILTERED: 'yellow', NEAR: 'yellow', 'NO DATA': 'muted', EXITED: 'muted' },
  exitKindLabels: { signal: 'signal', stop: 'stop', gap_stop: 'gap stop', max_hold: 'max hold' },
};
