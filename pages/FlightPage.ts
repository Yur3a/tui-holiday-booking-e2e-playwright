import type { Page } from '@playwright/test';
import { MESSAGES } from '../constants/messages.js';
import { REGEX } from '../constants/regex.js';
import { TIMEOUTS } from '../playwright.config.js';
import { waitForLoadingOverlayToClear } from '../utils/navigation.js';

export class FlightPage {
    constructor(private page: Page) { }

    async waitForFlights(): Promise<void> {
        await this.page.getByText(MESSAGES.FLIGHTS_HEADING)
            .waitFor({ state: 'visible', timeout: TIMEOUTS.HEAVY_CONTENT });
    }

    async getFlightInfo(): Promise<string> {
        await this.waitForFlights();

        const flightSection = this.page.getByText(MESSAGES.FLIGHTS_HEADING)
            .locator('..').locator('..');
        const flightText = (await flightSection.textContent())?.trim() ?? '';
        return flightText.replace(/\s+/g, ' ').substring(0, 200) || 'Default flight';
    }

    async clickContinue(): Promise<void> {
        const boekNuButton = this.page.getByRole('button', { name: REGEX.BOOK_NOW });
        await boekNuButton.waitFor({ state: 'visible' });

        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            if (/passengerdetails/.test(this.page.url())) break;

            await boekNuButton.click();

            // Early attempts use a shorter timeout; last attempt falls back to navigationTimeout
            const navigated = await this.page.waitForURL(/passengerdetails/, {
                ...(attempt < maxAttempts && { timeout: TIMEOUTS.PAGE_LOAD }),
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
