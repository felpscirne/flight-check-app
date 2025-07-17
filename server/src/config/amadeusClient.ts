const Amadeus = require('amadeus');
import dotenv from 'dotenv';

dotenv.config();

const amadeusClient = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID!,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
  hostname: process.env.NODE_ENV === 'production'
    ? 'api.amadeus.com'
    : 'test.api.amadeus.com'
});

export default amadeusClient;