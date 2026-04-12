import type { Locator, Page } from '@playwright/test';
import { ARIA, SELECTORS } from '../constants/selectors.js';
import { REGEX } from '../constants/regex.js';
import { MESSAGES } from '../constants/messages.js';

export class PassengerPage {
    constructor(private page: Page) { }

    async waitForPage(): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.getByRole('heading', { level: 1 }).filter({ hasText: MESSAGES.PASSENGER_HEADING })
            .waitFor({ state: 'visible', timeout: 30_000 });
    }

    get firstNameField(): Locator {
        return this.page.getByRole('textbox', { name: ARIA.FIRST_NAME }).first();
    }

    get lastNameField(): Locator {
        return this.page.getByRole('textbox', { name: ARIA.LAST_NAME }).first();
    }

    get emailField(): Locator {
        return this.page.getByRole('textbox', { name: ARIA.EMAIL }).first();
    }

    get phoneField(): Locator {
        return this.page.getByRole('textbox', { name: ARIA.PHONE }).first();
    }

    get dobDayField(): Locator {
        return this.page.getByRole('textbox', { name: ARIA.DOB_DAY }).first();
    }

    get dobMonthField(): Locator {
        return this.page.getByRole('textbox', { name: ARIA.DOB_MONTH }).first();
    }

    get dobYearField(): Locator {
        return this.page.getByRole('textbox', { name: ARIA.DOB_YEAR }).first();
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
        const submitButton = this.page.getByRole('button').filter({ hasText: REGEX.SUBMIT }).first();
        await submitButton.click();
    }

    private async getFieldError(field: Locator): Promise<string> {
        let current = field.locator('xpath=..');

        for (let i = 0; i < 4; i++) {
            const alert = current.getByRole('alert').first();
            if (await alert.isVisible().catch(() => false)) {
                const text = (await alert.textContent())?.trim() ?? '';
                if (text) return text;
            }
            current = current.locator('xpath=..');
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
            .filter({ hasText: REGEX.ERROR_BANNER }).first();
        if (await banner.isVisible().catch(() => false)) {
            return (await banner.textContent())?.trim() ?? '';
        }
        // Fallback: look for the banner by text
        const bannerByText = this.page.getByText(REGEX.ERROR_BANNER_FULL).first();
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
