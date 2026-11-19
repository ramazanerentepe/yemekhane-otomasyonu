const express = require('express');
const menuController = require('../controllers/menuController');
const { oturumGerekli } = require('../middleware/oturum');

const router = express.Router();

router.get('/yemekhaneler', oturumGerekli, menuController.yemekhaneler);
router.get('/ogunler', oturumGerekli, menuController.ogunler);
router.get('/menuler/hafta', oturumGerekli, menuController.haftalikMenu);
router.get('/menuler/:id/yorumlar', oturumGerekli, menuController.yorumlar);
router.get('/menu', oturumGerekli, menuController.gununMenusu);

module.exports = router;
