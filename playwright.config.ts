import { defineConfig } from '@playwright/test';

export default defineConfig({
    workers: 4,
    testDir: './tests',
    timeout: 300_000,
    expect: { timeout: 10_000 },
    fullyParallel: false,
    retries: 1,
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