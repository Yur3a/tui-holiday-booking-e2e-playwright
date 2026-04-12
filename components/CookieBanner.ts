import type { Page } from '@playwright/test';
import { MESSAGES } from '../constants/messages.js';

export class CookieBanner {
    constructor(private page: Page) { }

    async accept(): Promise<void> {
        const acceptButton = this.page.getByRole('button', { name: MESSAGES.COOKIE_ACCEPT });
        try {
            await acceptButton.waitFor({ state: 'visible', timeout: 10_000 });
            await acceptButton.click();
            await acceptButton.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => { });

            const overlay = this.page.locator('#__tealiumGDPRecModal');
            await overlay.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => { });
        } catch {
            // Cookie banner not displayed, safe to continue
        }
    }
}
