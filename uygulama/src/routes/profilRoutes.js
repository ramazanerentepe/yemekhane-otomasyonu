const express = require('express');
const profilController = require('../controllers/profilController');
const { oturumGerekli } = require('../middleware/oturum');

const router = express.Router();

router.get('/profil', oturumGerekli, profilController.getir);
router.put('/profil/alerjenler', oturumGerekli, profilController.alerjenleriKaydet);

module.exports = router;
