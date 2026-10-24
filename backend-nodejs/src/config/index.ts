import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  dbPath: process.env.DB_PATH || path.resolve(process.cwd(), 'dummy.db'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  isTest: process.env.NODE_ENV === 'test',
};
