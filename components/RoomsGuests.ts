import type { Locator, Page } from '@playwright/test';
import { ARIA } from '../constants/selectors.js';
import { REGEX } from '../constants/regex.js';

export class RoomsGuests {
    constructor(private page: Page) { }

    private getPanel(): Locator {
        return this.page.getByRole('region', { name: ARIA.ROOM_AND_GUEST });
    }

    async open(): Promise<void> {
        const trigger = this.page.getByRole('textbox', { name: ARIA.ROOMS_AND_GUESTS });
        await trigger.click();
        await this.getPanel().waitFor({ state: 'visible', timeout: 10_000 });
    }

    async setAdults(count: number): Promise<void> {
        const comboboxes = this.getPanel().getByRole('combobox');
        await comboboxes.nth(1).selectOption(String(count));
    }

    async setChildren(count: number): Promise<void> {
        const comboboxes = this.getPanel().getByRole('combobox');
        await comboboxes.nth(2).selectOption(String(count));
    }

    async setChildAge(): Promise<number> {
        const comboboxes = this.getPanel().getByRole('combobox');
        const comboboxCount = await comboboxes.count();

        if (comboboxCount <= 3) return 0;

        const ageCombobox = comboboxes.nth(3);
        const allTexts = await ageCombobox.locator('option').allTextContents();
        const numericAges = allTexts.map(t => t.trim()).filter(t => /^\d+$/.test(t));

        if (numericAges.length === 0) return 0;

        const randomAge = numericAges[Math.floor(Math.random() * numericAges.length)];
        await ageCombobox.selectOption(randomAge);
        return parseInt(randomAge, 10);
    }

    async confirm(): Promise<void> {
        const saveButton = this.getPanel().getByRole('button').filter({ hasText: REGEX.SAVE });
        await saveButton.click();
        await this.getPanel().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => { });
    }
}
