import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage.js';
import { SearchPage } from '../pages/SearchPage.js';
import { ResultsPage } from '../pages/ResultsPage.js';
import { HotelPage } from '../pages/HotelPage.js';
import { FlightPage } from '../pages/FlightPage.js';
import { PassengerPage } from '../pages/PassengerPage.js';
import { attach503Listener } from '../utils/navigation.js';

export interface PassengerPageState {
    url: string;
    cookies: { name: string; value: string; domain: string; path: string; expires: number; httpOnly: boolean; secure: boolean; sameSite: 'Strict' | 'Lax' | 'None' }[];
}

interface PageFixtures {
    homePage: HomePage;
    searchPage: SearchPage;
    resultsPage: ResultsPage;
    hotelPage: HotelPage;
    flightPage: FlightPage;
    passengerPage: PassengerPage;
}

interface WorkerFixtures {
    passengerPageState: PassengerPageState;
}

export const test = base.extend<PageFixtures, WorkerFixtures>({
    passengerPageState: [async ({ browser }, use) => {
        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            locale: 'nl-NL',
        });
        const page = await context.newPage();
        attach503Listener(page);

        const homePage = new HomePage(page);
        const searchPage = new SearchPage(page);
        const resultsPage = new ResultsPage(page);
        const hotelPage = new HotelPage(page);
        const flightPage = new FlightPage(page);

        await homePage.navigate();
        await homePage.acceptCookies();
        await searchPage.selectRandomDeparture();
        await searchPage.selectRandomDestination();
        await searchPage.selectRandomDate();
        await searchPage.configureGuests(2, 1);
        await searchPage.search();
        await resultsPage.selectFirstHotel();
        await hotelPage.waitForPage();
        await hotelPage.selectRoom();
        await hotelPage.clickContinue();
        await flightPage.getFlightInfo();
        await flightPage.clickContinue();

        const url = page.url();
        const { cookies } = await context.storageState();
        await context.close();

        await use({ url, cookies });
    }, { scope: 'worker' }],

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
