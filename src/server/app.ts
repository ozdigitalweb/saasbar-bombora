import express from 'express';
import { apiRouter } from './api-router.ts';

export const app = express();

app.use(express.json());
app.use('/api', apiRouter);
