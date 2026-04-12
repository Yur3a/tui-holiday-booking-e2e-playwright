export const SELECTORS = {
    SEARCH_BUTTON: '[aria-label="search button"]',
    VALIDATION_ERROR: '[class*="error"] [class*="message"], [class*="alert"]',
    ERROR_BANNER: '[class*="error"], [class*="Error"]',
} as const;

export const ARIA = {
    TEXT_INPUT: 'text input',
    AIRPORTS: 'airports',
    SELECT_DESTINATIONS: 'select destinations',
    SELECT_DATE: 'select date',
    DEPARTURE_DATE: 'Departure date',
    ROOMS_AND_GUESTS: 'rooms and guests',
    ROOM_AND_GUEST: 'room and guest',
    FIRST_NAME: 'Eerste voornaam',
    LAST_NAME: 'Achternaam',
    EMAIL: 'E-mailadres',
    PHONE: 'Mobiel telefoonnummer',
    DOB_DAY: 'day',
    DOB_MONTH: 'month',
    DOB_YEAR: 'year',
} as const;
