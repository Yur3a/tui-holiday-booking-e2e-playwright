# TUI Holiday Booking — E2E Playwright Tests

End-to-end test suite for the [TUI.nl](https://www.tui.nl) holiday booking flow. Covers the full journey from homepage to passenger details, plus form validation.

## Tech Stack

- TypeScript
- Playwright Test
- ESLint (Flat Config + typescript-eslint)
- Node.js 18+

## Project Structure

```
├── tests/
│   └── booking-flow.spec.ts        # Main booking flow + validation tests
├── pages/
│   ├── HomePage.ts
│   ├── SearchPage.ts
│   ├── ResultsPage.ts
│   ├── HotelPage.ts
│   ├── FlightPage.ts
│   └── PassengerPage.ts
├── components/
│   ├── AirportSelector.ts
│   ├── CookieBanner.ts
│   ├── DatePicker.ts
│   └── RoomsGuests.ts
├── fixtures/
│   ├── page.fixture.ts             # Custom fixtures (page objects injected into tests)
│   └── index.ts
├── constants/
│   ├── selectors.ts                # CSS selectors + ARIA labels
│   ├── messages.ts                 # Dutch UI messages for assertions
│   ├── regex.ts                    # Regex patterns for dynamic text
│   └── urls.ts
├── data/
│   └── booking.data.ts            # BookingDetails interface + factory
├── utils/
│   ├── navigation.ts              # safeGoto(), 503 listener
│   └── logger.ts
├── playwright.config.ts
├── eslint.config.ts
└── tsconfig.json
```

## Key Features

- Page Object Model with separate components (date picker, airport selector, rooms/guests, cookie banner)
- Custom Playwright fixtures for page object injection
- State-driven waits
- Retry logic for date/destination selection and 503 recovery
- Session caching for validation tests (`beforeAll` + cookies/URL restore)
- Role-based locators (`getByRole`, `getByText`)
- Typed `as const` constants for selectors, messages, regex
- ESLint with strict TypeScript rules
- Booking data logged to console

## How to Run

```bash
npm install
npx playwright install chromium
```

```bash
npm test                  # run tests
npm run test:headed       # with browser visible
npm run test:debug        # step-by-step debug
npm run test:ui           # Playwright UI mode
npm run report            # open HTML report
```

## Notes

- Runs against a live production site, so results depend on current availability
- The site uses Dutch language (`nl-NL` locale), all validation messages are in Dutch
- Main booking flow has 2 retries due to occasional 503 errors on the live site
- Validation tests run serially using a cached session from `beforeAll`
- **Maintainable at scale** adding a new page or validation test requires no changes to infrastructure code
