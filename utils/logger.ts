/* eslint-disable no-console */
import type { BookingDetails } from '../data/booking.data.js';

export class Logger {
    static info(label: string, value: string | number): void {
        console.log(`[TUI Booking] ${label}: ${value}`);
    }

    static section(title: string): void {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`  ${title}`);
        console.log(`${'='.repeat(50)}`);
    }

    static bookingDetails(details: BookingDetails): void {
        Logger.section('BOOKING DETAILS');
        Logger.info('Departure Airport', details.departureAirport);
        Logger.info('Destination', details.destination);
        Logger.info('Departure Date', details.departureDate);
        Logger.info('Child Age', details.childAge);
        Logger.info('Hotel Name', details.hotelName);
        Logger.info('Flight Info', details.flightInfo);
        console.log('='.repeat(50) + '\n');
    }
}
