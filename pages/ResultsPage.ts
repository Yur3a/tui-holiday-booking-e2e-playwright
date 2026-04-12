import type { Page } from '@playwright/test';
import { REGEX } from '../constants/regex.js';

export class ResultsPage {
    constructor(private page: Page) { }

    async waitForResults(): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.getByText(REGEX.RESULTS_COUNT).first()
            .waitFor({ state: 'visible', timeout: 30_000 });
    }

    async selectFirstHotel(): Promise<string> {
        await this.waitForResults();

        const firstHotelLink = this.page.getByRole('heading', { level: 5 })
            .first().getByRole('link');
        const name = (await firstHotelLink.textContent())?.trim() ?? 'Unknown Hotel';
        await firstHotelLink.click();

        return name;
    }
}
