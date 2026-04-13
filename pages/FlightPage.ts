import type { Page } from '@playwright/test';
import { MESSAGES } from '../constants/messages.js';
import { REGEX } from '../constants/regex.js';
import { waitForLoadingOverlayToClear } from '../utils/navigation.js';

export class FlightPage {
    constructor(private page: Page) { }

    async waitForFlights(): Promise<void> {
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

        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            if (/passengerdetails/.test(this.page.url())) break;

            await boekNuButton.click();

            const navigated = await this.page.waitForURL(/passengerdetails/, {
                timeout: attempt < maxAttempts ? 30_000 : 60_000,
                waitUntil: 'domcontentloaded',
            }).then(() => true).catch(() => false);

            if (navigated) break;

            if (attempt < maxAttempts) {
                console.warn(`[FlightPage] Boek Nu click attempt ${attempt} did not navigate, retrying...`);
            } else {
                throw new Error('Failed to navigate to passenger details after clicking Boek Nu');
            }
        }

        await waitForLoadingOverlayToClear(this.page);
    }
}
