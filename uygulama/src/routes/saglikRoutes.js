const express = require('express');
const saglikController = require('../controllers/saglikController');

const router = express.Router();

router.get('/', saglikController.durum);
router.get('/saglik', saglikController.veritabani);

module.exports = router;