const express = require('express');
const saglikRoutes = require('./routes/saglikRoutes');
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const { bulunamadi, hataYakalayici } = require('./middleware/hata');

const app = express();

app.use(express.json());
app.use('/api', saglikRoutes);
app.use('/api', authRoutes);
app.use('/api', menuRoutes);
app.use(bulunamadi);
app.use(hataYakalayici);

module.exports = app;