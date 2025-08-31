require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || true,
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);

module.exports = app;
