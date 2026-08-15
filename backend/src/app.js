import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import { connectMongo, testMongoConnection } from './config/mongodb.js';
import { testMysqlConnection } from './config/mysql.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import incidenciasRoutes from './routes/incidencias.routes.js';
import reportesRoutes from './routes/reportes.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res, next) => {
  try {
    await testMysqlConnection();
    await testMongoConnection();
    res.json({
      success: true,
      message: 'Campus-Fix backend en línea',
      databases: { mysql: true, mongodb: true },
    });
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/incidencias', incidenciasRoutes);
app.use('/api/reportes', reportesRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Campus-Fix backend escuchando en http://localhost:${env.port}`);
  connectMongo()
    .then(() => console.log('MongoDB conectado'))
    .catch((err) => console.error('Error conectando a MongoDB:', err.message));
});