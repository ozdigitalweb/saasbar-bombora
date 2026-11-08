import express from 'express';
import { apiRouter } from './api-router.ts';

export const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(express.json());
app.use('/api', apiRouter);
