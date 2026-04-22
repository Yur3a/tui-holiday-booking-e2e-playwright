import { expect, test } from '../fixtures/index.js';
import { createEmptyBooking } from '../data/booking.data.js';
import { MESSAGES } from '../constants/messages.js';
import { Logger } from '../utils/logger.js';
import { safeGoto } from '../utils/navigation.js';

test.describe('TUI Holiday Booking Flow', () => {
    const booking = createEmptyBooking();

    test.describe('Main Booking Flow', () => {
        test.describe.configure({ retries: 2 });

        test('should complete booking and reach passenger details', async ({
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

    test.describe('Passenger Details Validation', () => {
        test.beforeEach(async ({ page, passengerPage, passengerPageState }) => {
            await page.context().addCookies(passengerPageState.cookies);
            await safeGoto(page, passengerPageState.url);
            await passengerPage.waitForPage();
        });

        test('should require first name', async ({ passengerPage }) => {
            // Arrange
            await passengerPage.fillFirstName('');

            // Act
            await passengerPage.submitForm();

            // Assert
            const error = await passengerPage.getFirstNameError();
            expect(error).toContain(MESSAGES.FIRST_NAME_REQUIRED);
            Logger.info('First Name Required Error', error);
        });

        test('should require last name', async ({ passengerPage }) => {
            // Arrange
            await passengerPage.fillLastName('');

            // Act
            await passengerPage.submitForm();

            // Assert
            const error = await passengerPage.getLastNameError();
            expect(error).toContain(MESSAGES.LAST_NAME_REQUIRED);
            Logger.info('Last Name Required Error', error);
        });

        test('should reject invalid characters in first name', async ({ passengerPage }) => {
            // Arrange
            await passengerPage.fillFirstName('John123!@#');

            // Act
            await passengerPage.submitForm();

            // Assert
            const error = await passengerPage.getFirstNameError();
            expect(error).toContain(MESSAGES.FIRST_NAME_FORMAT);
            Logger.info('First Name Invalid Chars Error', error);
        });

        test('should reject invalid characters in last name', async ({ passengerPage }) => {
            // Arrange
            await passengerPage.fillLastName('Doe456$%^');

            // Act
            await passengerPage.submitForm();

            // Assert
            const error = await passengerPage.getLastNameError();
            expect(error).toContain(MESSAGES.LAST_NAME_FORMAT);
            Logger.info('Last Name Invalid Chars Error', error);
        });

        test('should reject invalid email format', async ({ passengerPage }) => {
            // Arrange
            await passengerPage.fillEmail('not-an-email');

            // Act
            await passengerPage.submitForm();

            // Assert
            const error = await passengerPage.getEmailError();
            expect(error).toContain(MESSAGES.EMAIL_INVALID);
            Logger.info('Email Format Error', error);
        });

        test('should require email', async ({ passengerPage }) => {
            // Arrange
            await passengerPage.fillEmail('');

            // Act
            await passengerPage.submitForm();

            // Assert
            const error = await passengerPage.getEmailError();
            expect(error).toContain(MESSAGES.EMAIL_REQUIRED);
            Logger.info('Email Required Error', error);
        });

        test('should reject invalid phone number', async ({ passengerPage }) => {
            // Arrange
            await passengerPage.fillPhone('abc');

            // Act
            await passengerPage.submitForm();

            // Assert
            const error = await passengerPage.getPhoneError();
            expect(error).toContain(MESSAGES.PHONE_INVALID);
            Logger.info('Phone Validation Error', error);
        });

        test('should reject invalid date of birth format', async ({ passengerPage }) => {
            // Arrange
            await passengerPage.fillDateOfBirth('99-99-9999');

            // Act
            await passengerPage.submitForm();

            // Assert
            const banner = await passengerPage.getFormBannerError();
            const allErrors = await passengerPage.getAllErrors();
            expect(banner || allErrors.length > 0).toBeTruthy();
            Logger.info('Date of Birth Format Banner', banner);
        });

        test('should show all errors on empty form submit', async ({ passengerPage }) => {
            // Arrange
            await passengerPage.fillFirstName('');
            await passengerPage.fillLastName('');
            await passengerPage.fillEmail('');
            await passengerPage.fillPhone('');

            // Act
            await passengerPage.submitForm();

            // Assert
            const allErrors = await passengerPage.getAllErrors();
            expect(allErrors.length).toBeGreaterThan(0);

            Logger.section('ALL VALIDATION ERRORS');
            allErrors.forEach((error, index) => {
                Logger.info(`Error ${index + 1}`, error);
            });
        });

        test('should reject special characters in name fields', async ({ passengerPage }) => {
            // Arrange
            await passengerPage.fillFirstName('!@#$%^&*()');
            await passengerPage.fillLastName('!@#$%^&*()');

            // Act
            await passengerPage.submitForm();

            // Assert
            const firstNameError = await passengerPage.getFirstNameError();
            const lastNameError = await passengerPage.getLastNameError();

            expect(firstNameError).toContain(MESSAGES.FIRST_NAME_FORMAT);
            expect(lastNameError).toContain(MESSAGES.LAST_NAME_FORMAT);

            Logger.info('First Name Special Chars Error', firstNameError);
            Logger.info('Last Name Special Chars Error', lastNameError);
        });

        test('should reject numeric values in name fields', async ({ passengerPage }) => {
            // Arrange
            await passengerPage.fillFirstName('12345');
            await passengerPage.fillLastName('67890');

            // Act
            await passengerPage.submitForm();

            // Assert
            const firstNameError = await passengerPage.getFirstNameError();
            const lastNameError = await passengerPage.getLastNameError();

            expect(firstNameError).toContain(MESSAGES.FIRST_NAME_FORMAT);
            expect(lastNameError).toContain(MESSAGES.LAST_NAME_FORMAT);

            Logger.info('First Name Numeric Error', firstNameError);
            Logger.info('Last Name Numeric Error', lastNameError);
        });

        test('should reject email without domain', async ({ passengerPage }) => {
            // Arrange
            await passengerPage.fillEmail('user@');

            // Act
            await passengerPage.submitForm();

            // Assert
            const error = await passengerPage.getEmailError();
            expect(error).toContain(MESSAGES.EMAIL_INVALID);
            Logger.info('Email No Domain Error', error);
        });

        test('should reject future date of birth', async ({ passengerPage }) => {
            // Arrange
            await passengerPage.fillDateOfBirth('01-01-2030');

            // Act
            await passengerPage.submitForm();

            // Assert
            const fieldError = await passengerPage.getDateOfBirthError();
            const banner = await passengerPage.getFormBannerError();
            expect(fieldError || banner).toBeTruthy();
            Logger.info('Future DOB Error', fieldError || banner);
        });
    });
});
