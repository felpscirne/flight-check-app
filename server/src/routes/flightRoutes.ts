import { Router } from 'express';
import { searchFlightsByCode, searchFlightsByCity } from '../controllers/flightController';

const router = Router();

router.post('/search-flights', searchFlightsByCode);

router.post('/search-by-city', searchFlightsByCity);

export default router;