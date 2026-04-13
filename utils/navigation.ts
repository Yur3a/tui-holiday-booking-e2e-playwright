import type { Page } from '@playwright/test';

const MAX_RETRIES = 3;
const LOADING_OVERLAY_SELECTOR = '#loading-spinner [aria-busy="true"], #loading-spinner .LoadingSpinner__overlay';

export async function safeGoto(page: Page, url: string): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded' });

        if (response && response.status() === 503) {
            console.warn(`[safeGoto] 503 on attempt ${attempt}/${MAX_RETRIES}: ${url}`);
            lastError = new Error(`Server returned 503 for ${url}`);
            if (attempt < MAX_RETRIES) {
                await page.reload({ waitUntil: 'domcontentloaded' });
                if (!(await isErrorPage(page))) return;
            }
            continue;
        }

        if (await isErrorPage(page)) {
            console.warn(`[safeGoto] Error page detected on attempt ${attempt}/${MAX_RETRIES}: ${url}`);
            lastError = new Error(`TUI error page detected for ${url}`);
            if (attempt < MAX_RETRIES) {
                await page.reload({ waitUntil: 'domcontentloaded' });
                if (!(await isErrorPage(page))) return;
            }
            continue;
        }

        return;
    }

    throw lastError ?? new Error(`Navigation failed after ${MAX_RETRIES} retries: ${url}`);
}

export async function waitForLoadingOverlayToClear(page: Page, timeout = 30_000): Promise<void> {
    const overlay = page.locator(LOADING_OVERLAY_SELECTOR).first();

    const isVisible = await overlay.isVisible({ timeout: 1_000 }).catch(() => false);
    if (isVisible) {
        await overlay.waitFor({ state: 'hidden', timeout }).catch(() => { });
    }

    await page.waitForFunction(
        (selector) => {
            const element = document.querySelector<HTMLElement>(selector);
            if (!element) return true;

            const style = window.getComputedStyle(element);
            return style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none';
        },
        LOADING_OVERLAY_SELECTOR,
        { timeout },
    ).catch(() => { });
}

export async function clickWhenReady(page: Page, clickAction: () => Promise<void>, timeout = 30_000): Promise<void> {
    await waitForLoadingOverlayToClear(page, timeout);
    await clickAction();
    await waitForLoadingOverlayToClear(page, timeout);
}

async function isErrorPage(page: Page): Promise<boolean> {
    return page.getByRole('heading', { level: 1 })
        .filter({ hasText: /time-out opgetreden/i })
        .isVisible({ timeout: 2_000 })
        .catch(() => false);
}

export function attach503Listener(page: Page): void {
    page.on('response', async (response) => {
        if (response.status() !== 503) return;

        console.warn(`[503 Listener] ${response.url()}`);

        const isBroken = await isErrorPage(page).catch(() => false);
        if (isBroken) {
            console.warn('[503 Listener] Error page detected, reloading...');
            await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => { });
        }
    });
}
