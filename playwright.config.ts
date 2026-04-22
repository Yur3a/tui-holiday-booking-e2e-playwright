import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;

/**
 * Custom timeouts for cases that genuinely differ from Playwright's built-in defaults.
 * Standard cases should NOT pass an explicit timeout (Playwright applies actionTimeout / navigationTimeout).
 *
 * Built-in defaults (see `use` below):
 *   actionTimeout  = 15 s  → covers waitFor, click, fill, etc.
 *   navigationTimeout = 60 s  → covers goto, waitForURL, etc.
 */
export const TIMEOUTS = {
    /** Short check for optional / conditional elements (3 s) */
    OPTIONAL: 3_000,
    /** Panel / overlay close animations (5 s) */
    PANEL: 5_000,
    /** Full page load — heading visible after navigation (30 s) */
    PAGE_LOAD: 30_000,
    /** Slow API-driven content, e.g. flight data (45 s) */
    HEAVY_CONTENT: 45_000,
} as const;

export default defineConfig({
    workers: 1,
    testDir: './tests',
    timeout: 300_000,
    expect: { timeout: 10_000 },
    fullyParallel: false,
    retries: isCI ? 2 : 1,
    reporter: [['html'], ['list']],
    use: {
        baseURL: 'https://www.tui.nl',
        headless: true,
        viewport: { width: 1920, height: 1080 },
        actionTimeout: 15_000,
        navigationTimeout: 60_000,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        locale: 'nl-NL',
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
    ],
});