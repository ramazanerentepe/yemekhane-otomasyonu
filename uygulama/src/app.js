const express = require('express');
const saglikRoutes = require('./routes/saglikRoutes');
const { bulunamadi, hataYakalayici } = require('./middleware/hata');

const app = express();

app.use(express.json());
app.use('/api', saglikRoutes);

app.use(bulunamadi);
app.use(hataYakalayici);

module.exports = app;