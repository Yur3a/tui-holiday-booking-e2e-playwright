import type { Page } from '@playwright/test';
import { ARIA } from '../constants/selectors.js';
import { REGEX } from '../constants/regex.js';
import { TIMEOUTS } from '../playwright.config.js';

export class AirportSelector {
    constructor(private page: Page) { }

    async selectRandomDeparture(): Promise<string> {
        const departureTrigger = this.page.getByRole('textbox', { name: ARIA.TEXT_INPUT });
        await departureTrigger.click();

        const airportsPanel = this.page.getByRole('region', { name: ARIA.AIRPORTS }).last();
        await airportsPanel.waitFor({ state: 'visible' });

        const airportItems = airportsPanel.getByRole('listitem');
        await airportItems.first().waitFor({ state: 'visible' });

        const count = await airportItems.count();
        if (count === 0) throw new Error('No departure airports found');

        const randomIndex = Math.floor(Math.random() * count);
        const selectedItem = airportItems.nth(randomIndex);

        await selectedItem.getByRole('checkbox').check();
        const name = (await selectedItem.textContent())?.trim() ?? '';

        const saveButton = airportsPanel.getByRole('button').filter({ hasText: REGEX.SAVE });
        await saveButton.click();
        await airportsPanel.waitFor({ state: 'hidden', timeout: TIMEOUTS.PANEL });

        return name;
    }

    async selectRandomDestination(): Promise<string> {
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.trySelectDestination();

                const trigger = this.page.getByRole('textbox', { name: ARIA.SELECT_DESTINATIONS });
                const placeholder = await trigger.getAttribute('placeholder').catch(() => '');
                const value = await trigger.inputValue().catch(() => '');
                if ((placeholder && !REGEX.DESTINATION_PLACEHOLDER.test(placeholder)) || (value && value.length > 1)) {
                    return result;
                }

                console.warn(`Attempt ${attempt}: destination field not filled, retrying...`);
                await this.page.keyboard.press('Escape');
            } catch (error) {
                console.warn(`Attempt ${attempt} failed: ${error}`);
                await this.page.keyboard.press('Escape');
            }
        }

        throw new Error('Failed to select destination after multiple attempts');
    }

    private async trySelectDestination(): Promise<string> {
        const destinationTrigger = this.page.getByRole('textbox', { name: ARIA.SELECT_DESTINATIONS });
        await destinationTrigger.click();

        const lijstToggle = this.page.getByText('Lijst').first();
        await lijstToggle.click();

        const destinationsPanel = this.page.getByRole('region', { name: 'destinations' }).last();
        await destinationsPanel.waitFor({ state: 'visible' });

        await destinationsPanel.getByRole('listitem').first()
            .waitFor({ state: 'visible' });

        const enabledLinks = destinationsPanel.locator('a:not(.DestinationsList__disabled)')
            .filter({ hasText: REGEX.DESTINATION_WORD });

        const allTexts = await enabledLinks.allTextContents();
        const allLinks = allTexts
            .map((raw, index) => ({ index, text: raw.trim() }))
            .filter(({ text }) => text && !REGEX.SYSTEM_LINK_TEXT.test(text));

        if (allLinks.length === 0) throw new Error('No enabled destination options found');

        const randomPick = allLinks[Math.floor(Math.random() * allLinks.length)];
        const selectedLink = enabledLinks.nth(randomPick.index);

        await selectedLink.scrollIntoViewIfNeeded();
        await selectedLink.click({ force: true });

        const subPanelCheckboxes = destinationsPanel.getByRole('checkbox');
        await subPanelCheckboxes.first().waitFor({ state: 'visible' });
        await subPanelCheckboxes.first().check();

        const saveButton = destinationsPanel.getByRole('button').filter({ hasText: REGEX.SAVE });
        await saveButton.click();
        await destinationsPanel.waitFor({ state: 'hidden', timeout: TIMEOUTS.PANEL }).catch((error) => {
            console.warn('[AirportSelector] Destinations panel did not hide:', error.message);
        });

        return randomPick.text;
    }
}
