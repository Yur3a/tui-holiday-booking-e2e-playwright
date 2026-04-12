export interface BookingDetails {
    departureAirport: string;
    destination: string;
    departureDate: string;
    childAge: number;
    hotelName: string;
    flightInfo: string;
}

export function createEmptyBooking(): BookingDetails {
    return {
        departureAirport: '',
        destination: '',
        departureDate: '',
        childAge: 0,
        hotelName: '',
        flightInfo: '',
    };
}
