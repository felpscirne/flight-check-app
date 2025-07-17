import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import flightRoutes from './routes/flightRoutes';
import amadeusClient from './config/amadeusClient';


dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.set('amadeus', amadeusClient);

app.use(cors());
app.use(express.json());

app.use('/api', flightRoutes);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});