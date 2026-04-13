import type { Locator, Page } from '@playwright/test';
import { ARIA } from '../constants/selectors.js';
import { REGEX } from '../constants/regex.js';
import { MESSAGES } from '../constants/messages.js';

export class DatePicker {
    constructor(private page: Page) { }

    private get datePanel() {
        return this.page.getByRole('region', { name: ARIA.DEPARTURE_DATE });
    }

    private get dateTrigger() {
        return this.page.getByRole('textbox', { name: ARIA.SELECT_DATE });
    }

    async selectRandomAvailableDate(): Promise<string> {
        const maxRetries = 6;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.trySelectDate(attempt);
            } catch (error) {
                console.warn(`Date selection attempt ${attempt} failed: ${error}`);
                await this.closePanel();
            }
        }

        throw new Error('Failed to select date after multiple attempts');
    }

    private async closePanel(): Promise<void> {
        await this.page.keyboard.press('Escape');
        await this.datePanel.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => { });
    }

    private async trySelectDate(attempt: number): Promise<string> {
        await this.dateTrigger.click();
        await this.datePanel.waitFor({ state: 'visible', timeout: 10_000 });

        const monthCombobox = this.datePanel.getByRole('combobox');
        await monthCombobox.waitFor({ state: 'visible', timeout: 5_000 });

        const selectedMonth = await this.pickMonth(monthCombobox, attempt);
        await monthCombobox.selectOption({ label: selectedMonth });

        const enabledCells = this.datePanel.locator(
            'td:not([aria-disabled="true"]):not(.disabled)'
        ).filter({ hasText: REGEX.DAY_NUMBER });
        const count = await enabledCells.count();
        if (count === 0) throw new Error(`No enabled dates for ${selectedMonth}`);

        const pickIdx = Math.floor(count / 3) + Math.floor(Math.random() * Math.max(1, Math.floor(count / 3)));
        const cell = enabledCells.nth(Math.min(pickIdx, count - 1));
        const dayText = (await cell.textContent() ?? '').trim();
        await cell.click();

        const saveButton = this.datePanel.getByRole('button').filter({ hasText: REGEX.SAVE });
        if (await saveButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await saveButton.click();
        }
        await this.datePanel.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => { });

        await this.verifyDateSelected();

        return `${dayText} ${selectedMonth}`;
    }

    private async pickMonth(combobox: Locator, attempt: number): Promise<string> {
        const allOptions = await combobox.locator('option').allTextContents();
        const monthOptions = allOptions.filter(opt => REGEX.MONTH_NAME.test(opt));
        if (monthOptions.length === 0) throw new Error('No valid month options found');

        const startIdx = Math.min(attempt - 1, monthOptions.length - 1);
        const selectedMonth = monthOptions[startIdx];

        console.warn(`Date attempt ${attempt}: month "${selectedMonth}" (${startIdx}/${monthOptions.length - 1})`);
        return selectedMonth;
    }

    private async verifyDateSelected(): Promise<void> {
        const fieldText = await this.dateTrigger.inputValue().catch(() =>
            this.dateTrigger.textContent().then(t => t ?? '')
        );

        if (!fieldText || fieldText.includes(MESSAGES.DATE_PLACEHOLDER)) {
            throw new Error('Date was not selected. Field still shows placeholder');
        }
    }
}
