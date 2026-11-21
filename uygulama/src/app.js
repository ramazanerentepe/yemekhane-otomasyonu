const express = require('express');
const saglikRoutes = require('./routes/saglikRoutes');
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const rezervasyonRoutes = require('./routes/rezervasyonRoutes');
const bakiyeRoutes = require('./routes/bakiyeRoutes');
const degerlendirmeRoutes = require('./routes/degerlendirmeRoutes');
const yoneticiRoutes = require('./routes/yoneticiRoutes');
const { bulunamadi, hataYakalayici } = require('./middleware/hata');

const app = express();

app.use(express.json());
app.use('/api', saglikRoutes);
app.use('/api', authRoutes);
app.use('/api', menuRoutes);
app.use('/api', rezervasyonRoutes);
app.use('/api', bakiyeRoutes);
app.use('/api', degerlendirmeRoutes);
app.use('/api', yoneticiRoutes);
app.use(bulunamadi);
app.use(hataYakalayici);

module.exports = app;