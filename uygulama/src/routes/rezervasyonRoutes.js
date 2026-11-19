const express = require('express');
const rezervasyonController = require('../controllers/rezervasyonController');
const { oturumGerekli } = require('../middleware/oturum');

const router = express.Router();

router.post('/rezervasyonlar', oturumGerekli, rezervasyonController.olustur);

module.exports = router;
