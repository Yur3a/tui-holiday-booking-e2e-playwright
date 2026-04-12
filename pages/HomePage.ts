import type { Page } from '@playwright/test';
import { CookieBanner } from '../components/CookieBanner.js';
import { URLS } from '../constants/urls.js';
import { safeGoto } from '../utils/navigation.js';

export class HomePage {
    private cookieBanner: CookieBanner;

    constructor(private page: Page) {
        this.cookieBanner = new CookieBanner(page);
    }

    async navigate(): Promise<void> {
        await safeGoto(this.page, URLS.HOME);
    }

    async acceptCookies(): Promise<void> {
        await this.cookieBanner.accept();
    }
}
