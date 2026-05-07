import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes/index';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);
app.use(errorHandler);

export default app;
