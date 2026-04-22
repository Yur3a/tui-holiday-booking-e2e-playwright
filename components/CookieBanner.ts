import type { Page } from '@playwright/test';
import { MESSAGES } from '../constants/messages.js';
import { TIMEOUTS } from '../playwright.config.js';

export class CookieBanner {
    constructor(private page: Page) { }

    async accept(): Promise<void> {
        const acceptButton = this.page.getByRole('button', { name: MESSAGES.COOKIE_ACCEPT });
        try {
            await acceptButton.waitFor({ state: 'visible' });
            await acceptButton.click();
            await acceptButton.waitFor({ state: 'hidden', timeout: TIMEOUTS.PANEL }).catch((error) => {
                console.warn('[CookieBanner] Accept button did not hide:', error.message);
            });

            const overlay = this.page.locator('#__tealiumGDPRecModal');
            await overlay.waitFor({ state: 'hidden', timeout: TIMEOUTS.PANEL }).catch((error) => {
                console.warn('[CookieBanner] GDPR overlay did not hide:', error.message);
            });
        } catch {
            console.warn('[CookieBanner] Cookie banner not displayed, continuing without accepting');
        }
    }
}
