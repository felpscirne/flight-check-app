import axios from 'axios';

interface AmadeusLocation {
  iataCode?: string;
  address?: {
    stateCode?: string;
  };
  geoCode?: {
    latitude: number;
    longitude: number;
  };
}

let amadeusToken = {
  value: null as string | null,
  expiresAt: 0,
};

const getAmadeusHostname = (): string => {
  return process.env.NODE_ENV === 'production'
    ? 'api.amadeus.com'
    : 'test.api.amadeus.com';
};

const getAccessToken = async (): Promise<string> => {
  if (amadeusToken.value && amadeusToken.expiresAt > Date.now()) {
    return amadeusToken.value;
  }
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
    expiresAt: Date.now() + (tokenData.expires_in * 1000),
  };
  return amadeusToken.value!;
};

export const findAirportCodes = async (cityName: string, stateCode?: string, countryCode?: string): Promise<string[]> => {
  const token = await getAccessToken();
  const normalizedCityName = cityName.toUpperCase();

  const params: any = {
    keyword: normalizedCityName,
    subType: 'CITY,AIRPORT',
  };

  if (countryCode) {
    params.countryCode = countryCode;
  }

  const response = await axios.get(`https://${getAmadeusHostname()}/v1/reference-data/locations`, {
    headers: { 'Authorization': `Bearer ${token}` },
    params: params, 
  });

  if (!response.data?.data) {
    return [];
  }

  let locations = response.data.data;

  if (stateCode) {
    const finalStateCode = stateCode.includes('-') ? stateCode.split('-')[1] : stateCode;
    locations = locations.filter((loc: any) => loc.address?.stateCode === finalStateCode);
  }

  if (locations.length === 0) {
    return [];
  }

  const iataCodes = locations
    .map((loc: any) => loc.iataCode)
    .filter(Boolean) as string[];

  return [...new Set(iataCodes)];
};

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