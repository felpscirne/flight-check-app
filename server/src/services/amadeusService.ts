import axios from 'axios';

interface AmadeusLocation {
  iataCode: string;
}

let amadeusToken = {
  value: null as string | null,
  expiresAt: 0,
};

/**
 * Returns the correct Amadeus API hostname based on the environment.
 */
const getAmadeusHostname = (): string => {
  return process.env.NODE_ENV === 'production'
    ? 'api.amadeus.com'
    : 'test.api.amadeus.com';
};

/**
 * Retrieves a valid Amadeus access token, fetching a new one if the cached token is missing or expired.
 * @returns {Promise<string>} A promise that resolves to the access token.
 */
const getAccessToken = async (): Promise<string> => {
  // If we have a valid, non-expired token, return it from cache.
  if (amadeusToken.value && amadeusToken.expiresAt > Date.now()) {
    return amadeusToken.value;
  }

  console.log('Amadeus token expired or missing, fetching new token...');
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.AMADEUS_CLIENT_ID!);
  params.append('client_secret', process.env.AMADEUS_CLIENT_SECRET!);
  
  const response = await axios.post(
    `https://${getAmadeusHostname()}/v1/security/oauth2/token`,
    params,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const tokenData = response.data;
  amadeusToken = {
    value: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in * 1000), // Convert expiry from seconds to milliseconds
  };

  return amadeusToken.value!;
};

/**
 * Finds all relevant airport IATA codes for a given city name.
 * @param {string} cityName - The name of the city.
 * @returns {Promise<string[]>} A list of unique IATA codes.
 */
export const findAirportCodes = async (cityName: string): Promise<string[]> => {
  const token = await getAccessToken();
  const normalizedCityName = cityName.toUpperCase();

  const response = await axios.get(`https://${getAmadeusHostname()}/v1/reference-data/locations`, {
    headers: { 'Authorization': `Bearer ${token}` },
    params: {
      keyword: normalizedCityName,
      subType: 'CITY,AIRPORT',
    },
  });

  if (!response.data?.data) return [];

  const iataCodes: string[] = response.data.data
    .map((loc: AmadeusLocation) => loc.iataCode)
    .filter(Boolean); 
  
  return [...new Set(iataCodes)]; // Return a list of unique codes
};

/**
 * Fetches flight offers from Amadeus based on search parameters.
 * @param {object} searchParams - The flight search parameters.
 * @returns {Promise<any[]>} A list of simplified flight objects.
 */
export const fetchFlightOffers = async (searchParams: any): Promise<any[]> => {
  const token = await getAccessToken();

  const response = await axios.get(`https://${getAmadeusHostname()}/v2/shopping/flight-offers`, {
    headers: { 'Authorization': `Bearer ${token}` },
    params: searchParams,
  });

  if (!response.data?.data) return [];
  
  return response.data.data.map((offer: any) => ({
    id: offer.id,
    origin: offer.itineraries[0].segments[0].departure.iataCode,
    destination: offer.itineraries[0].segments[0].arrival.iataCode,
    price: offer.price.total,
    departureTime: offer.itineraries[0].segments[0].departure.at,
    arrivalTime: offer.itineraries[0].segments[0].arrival.at,
    duration: offer.itineraries[0].duration.replace('PT', '').replace('H', 'H ').replace('M', 'M'),
    airline: offer.itineraries[0].segments[0].carrierCode,
  }));
};