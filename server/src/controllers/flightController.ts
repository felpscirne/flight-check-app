import { Request, Response } from 'express';
import { fetchFlightOffers, findAirportCodes } from '../services/amadeusService';

export const searchFlightsByCode = async (req: Request, res: Response) => {
  try {
    const { origin, destination, date, adults = '1', children = '0' } = req.body;
    if (!origin || !destination || !date) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const searchParams: any = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: date,
      adults: adults,
      currencyCode: 'BRL',
    };
    if (children && parseInt(children, 10) > 0) {
      searchParams.children = children;
    }
    
    const flights = await fetchFlightOffers(searchParams);
    res.status(200).json(flights);
  } catch (error: any) {
    console.error("--- ERROR IN CONTROLLER (searchFlightsByCode) ---", error.response?.data || error.message);
    res.status(500).json({ message: "Error while searching flights." });
  }
};

export const searchFlightsByCity = async (req: Request, res: Response) => {
  try {
    const { originCityName, destinationCityName, date, adults = '1', children = '0' } = req.body;
    if (!originCityName || !destinationCityName || !date) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const originAirportCodes = await findAirportCodes(originCityName);
    const destinationAirportCodes = await findAirportCodes(destinationCityName);

    if (originAirportCodes.length === 0 || destinationAirportCodes.length === 0) {
      return res.status(404).json({ error: 'Could not find airports for the specified cities.' });
    }
    
    const searchParams: any = {
      originLocationCode: originAirportCodes[0],
      destinationLocationCode: destinationAirportCodes[0],
      departureDate: date,
      adults: adults,
      currencyCode: 'BRL',
    };
    if (children && parseInt(children, 10) > 0) {
      searchParams.children = children;
    }

    const flights = await fetchFlightOffers(searchParams);
    res.status(200).json(flights);
  } catch (error: any) {
    console.error("--- ERROR IN CONTROLLER (searchFlightsByCity) ---", error.response?.data || error.message);
    res.status(500).json({ message: "Error while searching flights by city." });
  }
};