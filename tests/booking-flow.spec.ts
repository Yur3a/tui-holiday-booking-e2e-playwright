import { expect, test } from '../fixtures/index.js';
import { createEmptyBooking } from '../data/booking.data.js';
import { MESSAGES } from '../constants/messages.js';
import { Logger } from '../utils/logger.js';
import { safeGoto } from '../utils/navigation.js';

interface StorageStateSnapshot {
    cookies: { name: string; value: string; domain: string; path: string; expires: number; httpOnly: boolean; secure: boolean; sameSite: 'Strict' | 'Lax' | 'None' }[];
    origins: { origin: string; localStorage: { name: string; value: string }[] }[];
}

test.describe('TUI Holiday Booking Flow', () => {
    const booking = createEmptyBooking();

    test.describe('Main Booking Flow', () => {
        test.describe.configure({ retries: 2 });

        test('complete booking flow and reach passenger details', async ({
            homePage, searchPage, resultsPage, hotelPage, flightPage, passengerPage,
        }) => {
            await test.step('Navigate to homepage and accept cookies', async () => {
                await homePage.navigate();
                await homePage.acceptCookies();
            });

            await test.step('Select random departure airport', async () => {
                booking.departureAirport = await searchPage.selectRandomDeparture();
                Logger.info('Departure Airport', booking.departureAirport);
                expect(booking.departureAirport).toBeTruthy();
            });

            await test.step('Select random destination', async () => {
                booking.destination = await searchPage.selectRandomDestination();
                Logger.info('Destination', booking.destination);
                expect(booking.destination).toBeTruthy();
            });

            await test.step('Select available departure date', async () => {
                booking.departureDate = await searchPage.selectRandomDate();
                Logger.info('Departure Date', booking.departureDate);
                expect(booking.departureDate).toBeTruthy();
            });

            await test.step('Configure 2 adults, 1 child with random age', async () => {
                booking.childAge = await searchPage.configureGuests(2, 1);
                Logger.info('Child Age', booking.childAge);
            });

            await test.step('Search for holidays', async () => {
                await searchPage.search();
            });

            await test.step('Select first available hotel', async () => {
                booking.hotelName = await resultsPage.selectFirstHotel();
                Logger.info('Hotel Name', booking.hotelName);
                expect(booking.hotelName).not.toBe('Unknown Hotel');
            });

            await test.step('Continue from hotel details page', async () => {
                await hotelPage.waitForPage();
                await hotelPage.selectRoom();
                await hotelPage.clickContinue();
            });

            await test.step('Get flight info and continue', async () => {
                booking.flightInfo = await flightPage.getFlightInfo();
                await flightPage.clickContinue();
                Logger.info('Flight Info', booking.flightInfo);
                expect(booking.flightInfo).toBeTruthy();
            });

            await test.step('Verify passenger details page loaded', async () => {
                await passengerPage.waitForPage();
            });

            Logger.bookingDetails(booking);
        });
    });

    test.describe.serial('Passenger Details Validation', () => {
        let passengerPageUrl: string | undefined;
        let savedStorageState: StorageStateSnapshot | undefined;

        test.beforeAll(async ({ browser }) => {
            const context = await browser.newContext({
                viewport: { width: 1920, height: 1080 },
                locale: 'nl-NL',
            });
            const page = await context.newPage();

            const { HomePage } = await import('../pages/HomePage.js');
            const { SearchPage } = await import('../pages/SearchPage.js');
            const { ResultsPage } = await import('../pages/ResultsPage.js');
            const { HotelPage } = await import('../pages/HotelPage.js');
            const { FlightPage } = await import('../pages/FlightPage.js');
            const { attach503Listener } = await import('../utils/navigation.js');

            const homePage = new HomePage(page);
            const searchPage = new SearchPage(page);
            const resultsPage = new ResultsPage(page);
            const hotelPage = new HotelPage(page);
            const flightPage = new FlightPage(page);

            attach503Listener(page);

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

            passengerPageUrl = page.url();
            savedStorageState = await context.storageState();
            await context.close();
        });

        test.beforeEach(async ({ page, homePage, passengerPage }) => {
            if (passengerPageUrl && savedStorageState) {
                await page.context().addCookies(savedStorageState.cookies);
                await safeGoto(page, passengerPageUrl);
            } else {
                const { SearchPage } = await import('../pages/SearchPage.js');
                const { ResultsPage } = await import('../pages/ResultsPage.js');
                const { HotelPage } = await import('../pages/HotelPage.js');
                const { FlightPage } = await import('../pages/FlightPage.js');

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
            }
            await passengerPage.waitForPage();
        });

        test('missing first name shows required error', async ({ passengerPage }) => {
            await passengerPage.fillFirstName('');
            await passengerPage.submitForm();

            const error = await passengerPage.getFirstNameError();
            expect(error).toContain(MESSAGES.FIRST_NAME_REQUIRED);
            Logger.info('First Name Required Error', error);
        });

        test('missing last name shows required error', async ({ passengerPage }) => {
            await passengerPage.fillLastName('');
            await passengerPage.submitForm();

            const error = await passengerPage.getLastNameError();
            expect(error).toContain(MESSAGES.LAST_NAME_REQUIRED);
            Logger.info('Last Name Required Error', error);
        });

        test('invalid characters in first name shows format error', async ({ passengerPage }) => {
            await passengerPage.fillFirstName('John123!@#');
            await passengerPage.submitForm();

            const error = await passengerPage.getFirstNameError();
            expect(error).toContain(MESSAGES.FIRST_NAME_FORMAT);
            Logger.info('First Name Invalid Chars Error', error);
        });

        test('invalid characters in last name shows format error', async ({ passengerPage }) => {
            await passengerPage.fillLastName('Doe456$%^');
            await passengerPage.submitForm();

            const error = await passengerPage.getLastNameError();
            expect(error).toContain(MESSAGES.LAST_NAME_FORMAT);
            Logger.info('Last Name Invalid Chars Error', error);
        });

        test('invalid email format shows validation error', async ({ passengerPage }) => {
            await passengerPage.fillEmail('not-an-email');
            await passengerPage.submitForm();

            const error = await passengerPage.getEmailError();
            expect(error).toContain(MESSAGES.EMAIL_INVALID);
            Logger.info('Email Format Error', error);
        });

        test('missing email shows required error', async ({ passengerPage }) => {
            await passengerPage.fillEmail('');
            await passengerPage.submitForm();

            const error = await passengerPage.getEmailError();
            expect(error).toContain(MESSAGES.EMAIL_REQUIRED);
            Logger.info('Email Required Error', error);
        });

        test('invalid phone number shows validation error', async ({ passengerPage }) => {
            await passengerPage.fillPhone('abc');
            await passengerPage.submitForm();

            const error = await passengerPage.getPhoneError();
            expect(error).toContain(MESSAGES.PHONE_INVALID);
            Logger.info('Phone Validation Error', error);
        });

        test('invalid date of birth format shows error', async ({ passengerPage }) => {
            await passengerPage.fillDateOfBirth('99-99-9999');
            await passengerPage.submitForm();

            const banner = await passengerPage.getFormBannerError();
            const allErrors = await passengerPage.getAllErrors();
            expect(banner || allErrors.length > 0).toBeTruthy();
            Logger.info('Date of Birth Format Banner', banner);
        });

        test('submitting empty form shows all required field errors', async ({ passengerPage }) => {
            await passengerPage.fillFirstName('');
            await passengerPage.fillLastName('');
            await passengerPage.fillEmail('');
            await passengerPage.fillPhone('');
            await passengerPage.submitForm();

            const allErrors = await passengerPage.getAllErrors();
            expect(allErrors.length).toBeGreaterThan(0);

            Logger.section('ALL VALIDATION ERRORS');
            allErrors.forEach((error, index) => {
                Logger.info(`Error ${index + 1}`, error);
            });
        });

        test('special characters only in name fields show errors', async ({ passengerPage }) => {
            await passengerPage.fillFirstName('!@#$%^&*()');
            await passengerPage.fillLastName('!@#$%^&*()');
            await passengerPage.submitForm();

            const firstNameError = await passengerPage.getFirstNameError();
            const lastNameError = await passengerPage.getLastNameError();

            expect(firstNameError).toContain(MESSAGES.FIRST_NAME_FORMAT);
            expect(lastNameError).toContain(MESSAGES.LAST_NAME_FORMAT);

            Logger.info('First Name Special Chars Error', firstNameError);
            Logger.info('Last Name Special Chars Error', lastNameError);
        });

        test('numeric values in name fields show errors', async ({ passengerPage }) => {
            await passengerPage.fillFirstName('12345');
            await passengerPage.fillLastName('67890');
            await passengerPage.submitForm();

            const firstNameError = await passengerPage.getFirstNameError();
            const lastNameError = await passengerPage.getLastNameError();

            expect(firstNameError).toContain(MESSAGES.FIRST_NAME_FORMAT);
            expect(lastNameError).toContain(MESSAGES.LAST_NAME_FORMAT);

            Logger.info('First Name Numeric Error', firstNameError);
            Logger.info('Last Name Numeric Error', lastNameError);
        });

        test('email without domain shows validation error', async ({ passengerPage }) => {
            await passengerPage.fillEmail('user@');
            await passengerPage.submitForm();

            const error = await passengerPage.getEmailError();
            expect(error).toContain(MESSAGES.EMAIL_INVALID);
            Logger.info('Email No Domain Error', error);
        });

        test('future date of birth shows validation error', async ({ passengerPage }) => {
            await passengerPage.fillDateOfBirth('01-01-2030');
            await passengerPage.submitForm();

            const fieldError = await passengerPage.getDateOfBirthError();
            const banner = await passengerPage.getFormBannerError();
            expect(fieldError || banner).toBeTruthy();
            Logger.info('Future DOB Error', fieldError || banner);
        });
    });
});
