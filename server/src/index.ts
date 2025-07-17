import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

const Amadeus = require('amadeus');

dotenv.config();


interface Flight {
  id: string;
  origin: string;
  destination: string;
  price: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  airline: string;
}

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(cors()); 
app.use(express.json()); 

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID!,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
});

app.post('/api/search-flights', async (req: Request, res: Response) => {
  const { origin, destination, date, adults = '1', children = '0' } = req.body;

  if (!origin || !destination || !date) {
    return res.status(400).json({ error: 'Parâmetros faltando: origem, destino e data são obrigatórios.' });
  }

  try {
    const searchParams: any = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: date,
      adults: adults,
      currencyCode: 'BRL',
      max: 15,
    };

    if (children && parseInt(children, 10) > 0) {
      searchParams.children = children;
    }

    const response = await amadeus.shopping.flightOffersSearch.get(searchParams);

    const simplifiedFlights: Flight[] = response.data.map((offer: any) => {
      const firstItinerary = offer.itineraries[0];
      const firstSegment = firstItinerary.segments[0];

      return {
        id: offer.id,
        origin: firstSegment.departure.iataCode,
        destination: firstSegment.arrival.iataCode,
        price: offer.price.total,
        departureTime: firstSegment.departure.at,
        arrivalTime: firstSegment.arrival.at,
        duration: firstItinerary.duration.replace('PT', '').replace('H', 'H ').replace('M', 'M'),
        airline: firstSegment.carrierCode,
      };
    });
    
    res.status(200).json(simplifiedFlights);

  } catch (error: any) {
    console.error(error.response?.data || error);
    
    const statusCode = error.response?.status || 500;
    res.status(statusCode).json({
      message: "Error while communicating to Amadeus.",
      amadeusError: error.response?.data || { description: "No additional details from Amadeus." }
    });
  }
});

app.listen(port, () => {
  console.log(`[server]: running in http://localhost:${port}`);
});