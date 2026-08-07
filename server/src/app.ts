import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from './config/env';
import { authRoutes } from './routes/auth';
import { boardsRoutes } from './routes/boards';
import { cardsRoutes } from './routes/cards';
import { listsRoutes } from './routes/lists';
import { ApiError, errorBody } from './utils/http';

export const app = express();

app.use(
  cors({
    origin: env.clientOrigin,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/boards', boardsRoutes);
app.use('/api/v1', listsRoutes);
app.use('/api/v1', cardsRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json(errorBody('NOT_FOUND', 'Route not found'));
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json(errorBody(err.code, err.message));
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json(errorBody('VALIDATION', err.message));
  }
  const anyErr = err as { status?: number; code?: string; message?: string };
  if (anyErr.status && anyErr.code) {
    return res.status(anyErr.status).json(
      errorBody(anyErr.code, anyErr.message || 'Request failed'),
    );
  }
  console.error('[error]', err);
  res.status(500).json(errorBody('SERVER_ERROR', 'Internal server error'));
});
