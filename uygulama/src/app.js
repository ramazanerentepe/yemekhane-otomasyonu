const express = require('express');
const saglikRoutes = require('./routes/saglikRoutes');

const app = express();

app.use(express.json());
app.use('/api', saglikRoutes);

module.exports = app;