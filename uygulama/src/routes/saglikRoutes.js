const express = require('express');
const saglikController = require('../controllers/saglikController');

const router = express.Router();

router.get('/', saglikController.durum);

module.exports = router;