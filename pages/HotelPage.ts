import type { Page } from '@playwright/test';
import { REGEX } from '../constants/regex.js';
import { TIMEOUTS } from '../playwright.config.js';
import { waitForLoadingOverlayToClear, waitForPageReady } from '../utils/navigation.js';

export class HotelPage {
    constructor(private page: Page) { }

    async waitForPage(): Promise<void> {
        await waitForLoadingOverlayToClear(this.page);
        await this.page.getByRole('heading', { level: 1 })
            .waitFor({ state: 'visible', timeout: TIMEOUTS.PAGE_LOAD });
    }

    async selectRoom(): Promise<void> {
        const selectButton = this.page.getByRole('button')
            .filter({ hasText: REGEX.SELECT_ROOM })
            .first();

        const isVisible = await selectButton.isVisible({ timeout: TIMEOUTS.OPTIONAL }).catch(() => false);
        if (isVisible) {
            await waitForLoadingOverlayToClear(this.page);
            await selectButton.click();
            await this.page.waitForLoadState('domcontentloaded');
        }
    }

    async clickContinue(): Promise<void> {
        const continueButton = this.page.getByRole('button')
            .filter({ hasText: REGEX.CONTINUE })
            .first();
        await continueButton.waitFor({ state: 'visible' });
        await waitForPageReady(this.page);
        await continueButton.click();
        await this.page.waitForLoadState('domcontentloaded');
    }
}
