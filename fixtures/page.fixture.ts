import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage.js';
import { SearchPage } from '../pages/SearchPage.js';
import { ResultsPage } from '../pages/ResultsPage.js';
import { HotelPage } from '../pages/HotelPage.js';
import { FlightPage } from '../pages/FlightPage.js';
import { PassengerPage } from '../pages/PassengerPage.js';
import { attach503Listener } from '../utils/navigation.js';

interface PageFixtures {
    homePage: HomePage;
    searchPage: SearchPage;
    resultsPage: ResultsPage;
    hotelPage: HotelPage;
    flightPage: FlightPage;
    passengerPage: PassengerPage;
}

export const test = base.extend<PageFixtures>({
    page: async ({ page }, use) => {
        attach503Listener(page);
        await use(page);
    },
    homePage: async ({ page }, use) => {
        await use(new HomePage(page));
    },
    searchPage: async ({ page }, use) => {
        await use(new SearchPage(page));
    },
    resultsPage: async ({ page }, use) => {
        await use(new ResultsPage(page));
    },
    hotelPage: async ({ page }, use) => {
        await use(new HotelPage(page));
    },
    flightPage: async ({ page }, use) => {
        await use(new FlightPage(page));
    },
    passengerPage: async ({ page }, use) => {
        await use(new PassengerPage(page));
    },
});

export { expect } from '@playwright/test';
