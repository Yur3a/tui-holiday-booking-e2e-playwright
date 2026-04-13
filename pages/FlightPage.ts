import type { Page } from '@playwright/test';
import { MESSAGES } from '../constants/messages.js';
import { REGEX } from '../constants/regex.js';
import { waitForLoadingOverlayToClear, waitForPageReady } from '../utils/navigation.js';

export class FlightPage {
    constructor(private page: Page) { }

    async waitForFlights(): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForURL(/flow\/summary/, { timeout: 30_000, waitUntil: 'domcontentloaded' });
        await this.page.getByText(MESSAGES.FLIGHTS_HEADING).first()
            .waitFor({ state: 'visible', timeout: 45_000 });
        await waitForPageReady(this.page);
    }

    async getFlightInfo(): Promise<string> {
        await this.waitForFlights();

        const flightSection = this.page.getByText(MESSAGES.FLIGHTS_HEADING)
            .locator('..').locator('..').first();
        const flightText = (await flightSection.textContent())?.trim() ?? '';
        return flightText.replace(/\s+/g, ' ').substring(0, 200) || 'Default flight';
    }

    async clickContinue(): Promise<void> {
        await waitForPageReady(this.page);

        const boekNuButton = this.page.getByRole('button').filter({ hasText: REGEX.BOOK_NOW }).first();
        await boekNuButton.waitFor({ state: 'visible', timeout: 15_000 });

        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            if (/passengerdetails/.test(this.page.url())) break;

            await waitForLoadingOverlayToClear(this.page, 60_000);
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

        await waitForLoadingOverlayToClear(this.page, 60_000);
    }
}
