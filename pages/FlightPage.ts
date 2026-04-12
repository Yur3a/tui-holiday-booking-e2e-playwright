import type { Page } from '@playwright/test';
import { MESSAGES } from '../constants/messages.js';
import { REGEX } from '../constants/regex.js';

export class FlightPage {
    constructor(private page: Page) { }

    async waitForFlights(): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.getByText(MESSAGES.FLIGHTS_HEADING).first()
            .waitFor({ state: 'visible', timeout: 30_000 });
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
        await boekNuButton.click();
        await this.page.waitForURL(/passengerdetails/, { timeout: 30_000 });
    }
}
