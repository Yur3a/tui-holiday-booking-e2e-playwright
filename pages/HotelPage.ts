import type { Page } from '@playwright/test';
import { REGEX } from '../constants/regex.js';

export class HotelPage {
    constructor(private page: Page) { }

    async waitForPage(): Promise<void> {
        await this.page.getByRole('heading', { level: 1 }).first()
            .waitFor({ state: 'visible', timeout: 30_000 });
    }

    async selectRoom(): Promise<void> {
        const selectButton = this.page.getByRole('button')
            .filter({ hasText: REGEX.SELECT_ROOM })
            .first();

        const isVisible = await selectButton.isVisible({ timeout: 5_000 }).catch(() => false);
        if (isVisible) {
            await selectButton.click();
            await this.page.waitForLoadState('domcontentloaded');
        }
    }

    async clickContinue(): Promise<void> {
        const continueButton = this.page.getByRole('button')
            .filter({ hasText: REGEX.CONTINUE })
            .first();
        await continueButton.waitFor({ state: 'visible', timeout: 15_000 });
        await continueButton.click();
        await this.page.waitForLoadState('domcontentloaded');
    }
}
