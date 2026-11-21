const express = require('express');
const rezervasyonController = require('../controllers/rezervasyonController');
const { oturumGerekli } = require('../middleware/oturum');

const router = express.Router();

router.get('/rezervasyonlar', oturumGerekli, rezervasyonController.listele);
router.post('/rezervasyonlar', oturumGerekli, rezervasyonController.olustur);
router.post('/rezervasyonlar/:id/iptal', oturumGerekli, rezervasyonController.iptal);

module.exports = router;
