const express = require('express');
const yoneticiController = require('../controllers/yoneticiController');
const { oturumGerekli, yoneticiGerekli } = require('../middleware/oturum');

const router = express.Router();
const yonetici = [oturumGerekli, yoneticiGerekli];

router.get('/yonetici/rapor', ...yonetici, yoneticiController.rapor);
router.get('/yonetici/yemekler', ...yonetici, yoneticiController.yemekler);
router.post('/yonetici/menuler', ...yonetici, yoneticiController.menuOlustur);
router.put('/yonetici/menuler/:id', ...yonetici, yoneticiController.menuGuncelle);

module.exports = router;
