import type { Page } from '@playwright/test';
import { MESSAGES } from '../constants/messages.js';
import { REGEX } from '../constants/regex.js';
import { clickWhenReady, waitForLoadingOverlayToClear } from '../utils/navigation.js';

export class FlightPage {
    constructor(private page: Page) { }

    async waitForFlights(): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded');
        await waitForLoadingOverlayToClear(this.page);
        await this.page.waitForURL(/flow\/summary/, { timeout: 30_000 });
        await this.page.getByText(MESSAGES.FLIGHTS_HEADING).first()
            .waitFor({ state: 'visible', timeout: 45_000 });
    }

    async getFlightInfo(): Promise<string> {
        await this.waitForFlights();

        const flightSection = this.page.getByText(MESSAGES.FLIGHTS_HEADING)
            .locator('..').locator('..').first();
        const flightText = (await flightSection.textContent())?.trim() ?? '';
        return flightText.replace(/\s+/g, ' ').substring(0, 200) || 'Default flight';
    }

    async clickContinue(): Promise<void> {
        const boekNuButton = this.page.getByRole('button').filter({ hasText: REGEX.BOOK_NOW }).first();
        await boekNuButton.waitFor({ state: 'visible', timeout: 15_000 });
        await clickWhenReady(this.page, () => boekNuButton.click(), 45_000);
        await this.page.waitForURL(/passengerdetails/, { timeout: 30_000 });
        await this.page.waitForLoadState('domcontentloaded');
        await waitForLoadingOverlayToClear(this.page, 45_000);
    }
}
