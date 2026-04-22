import type { Page } from '@playwright/test';
import { AirportSelector } from '../components/AirportSelector.js';
import { DatePicker } from '../components/DatePicker.js';
import { RoomsGuests } from '../components/RoomsGuests.js';
import { SELECTORS } from '../constants/selectors.js';
import { REGEX } from '../constants/regex.js';
import { TIMEOUTS } from '../playwright.config.js';

export class SearchPage {
    private airportSelector: AirportSelector;
    private datePicker: DatePicker;
    private roomsGuests: RoomsGuests;

    constructor(private page: Page) {
        this.airportSelector = new AirportSelector(page);
        this.datePicker = new DatePicker(page);
        this.roomsGuests = new RoomsGuests(page);
    }

    async selectRandomDeparture(): Promise<string> {
        return this.airportSelector.selectRandomDeparture();
    }

    async selectRandomDestination(): Promise<string> {
        const maxDepartureRetries = 3;

        for (let i = 0; i < maxDepartureRetries; i++) {
            try {
                return await this.airportSelector.selectRandomDestination();
            } catch (error) {
                if (i < maxDepartureRetries - 1) {
                    console.warn(`[SearchPage] Destination selection failed, switching departure (retry ${i + 1}): ${error}`);
                    await this.airportSelector.selectRandomDeparture();
                    continue;
                }
                throw error;
            }
        }

        throw new Error('Failed to find a departure airport with available destinations');
    }

    async selectRandomDate(): Promise<string> {
        const maxDestinationRetries = 3;

        for (let i = 0; i < maxDestinationRetries; i++) {
            try {
                return await this.datePicker.selectRandomAvailableDate();
            } catch (error) {
                if (i < maxDestinationRetries - 1) {
                    console.warn(`[SearchPage] Date selection failed, picking a new destination (retry ${i + 1}): ${error}`);
                    await this.airportSelector.selectRandomDestination();
                    continue;
                }
                throw error;
            }
        }

        throw new Error('Failed to find a destination with available dates');
    }

    async configureGuests(adults: number, children: number): Promise<number> {
        await this.roomsGuests.open();
        await this.roomsGuests.setAdults(adults);
        await this.roomsGuests.setChildren(children);
        const childAge = await this.roomsGuests.setChildAge();
        await this.roomsGuests.confirm();
        return childAge;
    }

    async search(): Promise<void> {
        const searchButton = this.page.getByRole('button', { name: 'search button' });
        await searchButton.click();

        const errorMessage = this.page.locator(SELECTORS.VALIDATION_ERROR)
            .filter({ hasText: REGEX.SEARCH_VALIDATION });
        const hasError = await errorMessage.isVisible({ timeout: TIMEOUTS.OPTIONAL }).catch(() => false);
        if (hasError) {
            const errorText = await errorMessage.textContent().catch(() => 'Unknown validation error');
            throw new Error(`Search form validation error: ${errorText}`);
        }

        await this.page.waitForLoadState('domcontentloaded');
    }
}
