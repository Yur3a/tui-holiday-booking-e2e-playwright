import type { Locator, Page } from '@playwright/test';
import { ARIA, SELECTORS } from '../constants/selectors.js';
import { REGEX } from '../constants/regex.js';
import { MESSAGES } from '../constants/messages.js';
import { TIMEOUTS } from '../playwright.config.js';

export class PassengerPage {
    constructor(private page: Page, private passengerIndex = 0) { }

    async waitForPage(): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.getByRole('heading', { level: 1 }).filter({ hasText: MESSAGES.PASSENGER_HEADING })
            .waitFor({ state: 'visible', timeout: TIMEOUTS.PAGE_LOAD });
    }

    // Multiple passengers share the same field names; nth() scopes to a specific passenger
    get firstNameField(): Locator {
        return this.page.getByRole('textbox', { name: ARIA.FIRST_NAME }).nth(this.passengerIndex);
    }

    get lastNameField(): Locator {
        return this.page.getByRole('textbox', { name: ARIA.LAST_NAME }).nth(this.passengerIndex);
    }

    get emailField(): Locator {
        return this.page.getByRole('textbox', { name: ARIA.EMAIL }).nth(this.passengerIndex);
    }

    get phoneField(): Locator {
        return this.page.getByRole('textbox', { name: ARIA.PHONE }).nth(this.passengerIndex);
    }

    get dobDayField(): Locator {
        return this.page.getByRole('textbox', { name: ARIA.DOB_DAY }).nth(this.passengerIndex);
    }

    get dobMonthField(): Locator {
        return this.page.getByRole('textbox', { name: ARIA.DOB_MONTH }).nth(this.passengerIndex);
    }

    get dobYearField(): Locator {
        return this.page.getByRole('textbox', { name: ARIA.DOB_YEAR }).nth(this.passengerIndex);
    }

    async fillFirstName(value: string): Promise<void> {
        await this.firstNameField.clear();
        if (value) {
            await this.firstNameField.fill(value);
        }
        await this.firstNameField.blur();
    }

    async fillLastName(value: string): Promise<void> {
        await this.lastNameField.clear();
        if (value) {
            await this.lastNameField.fill(value);
        }
        await this.lastNameField.blur();
    }

    async fillEmail(value: string): Promise<void> {
        await this.emailField.clear();
        if (value) {
            await this.emailField.fill(value);
        }
        await this.emailField.blur();
    }

    async fillPhone(value: string): Promise<void> {
        await this.phoneField.clear();
        if (value) {
            await this.phoneField.fill(value);
        }
        await this.phoneField.blur();
    }

    async fillDateOfBirth(value: string): Promise<void> {
        const parts = value.split('-');
        const day = parts[0] ?? '';
        const month = parts[1] ?? '';
        const year = parts[2] ?? '';

        await this.dobDayField.clear();
        if (day) await this.dobDayField.fill(day);

        await this.dobMonthField.clear();
        if (month) await this.dobMonthField.fill(month);

        await this.dobYearField.clear();
        if (year) await this.dobYearField.fill(year);

        await this.dobYearField.blur();
    }

    async submitForm(): Promise<void> {
        const submitButton = this.page.getByRole('button', { name: REGEX.SUBMIT });
        await submitButton.click();
    }

    private async getFieldError(field: Locator): Promise<string> {
        const errorContainer = field.locator('xpath=ancestor::*[.//div[@role="alert"]]').first();
        const alert = errorContainer.getByRole('alert');

        if (await alert.isVisible({ timeout: TIMEOUTS.OPTIONAL }).catch(() => false)) {
            return (await alert.textContent())?.trim() ?? '';
        }

        return '';
    }

    async getFirstNameError(): Promise<string> {
        return this.getFieldError(this.firstNameField);
    }

    async getLastNameError(): Promise<string> {
        return this.getFieldError(this.lastNameField);
    }

    async getEmailError(): Promise<string> {
        return this.getFieldError(this.emailField);
    }

    async getPhoneError(): Promise<string> {
        return this.getFieldError(this.phoneField);
    }

    // Try day field's container first — error is likely shared for the date group
    async getDateOfBirthError(): Promise<string> {
        const error = await this.getFieldError(this.dobDayField);
        if (error) return error;
        return this.getFieldError(this.dobYearField);
    }

    async getFormBannerError(): Promise<string> {
        const banner = this.page.locator(SELECTORS.ERROR_BANNER)
            .filter({ hasText: REGEX.ERROR_BANNER });
        if (await banner.isVisible().catch(() => false)) {
            return (await banner.textContent())?.trim() ?? '';
        }
        // Fallback: look for the banner by text
        const bannerByText = this.page.getByText(REGEX.ERROR_BANNER_FULL);
        if (await bannerByText.isVisible().catch(() => false)) {
            return (await bannerByText.textContent())?.trim() ?? '';
        }
        return '';
    }

    async getAllErrors(): Promise<string[]> {
        const alerts = this.page.getByRole('alert');
        const allTexts = await alerts.allTextContents();
        return allTexts.map(t => t.trim()).filter(Boolean);
    }
}
