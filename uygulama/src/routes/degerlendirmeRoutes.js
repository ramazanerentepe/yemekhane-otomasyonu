const express = require('express');
const degerlendirmeController = require('../controllers/degerlendirmeController');
const { oturumGerekli } = require('../middleware/oturum');

const router = express.Router();

router.post('/degerlendirmeler', oturumGerekli, degerlendirmeController.degerlendir);

module.exports = router;
