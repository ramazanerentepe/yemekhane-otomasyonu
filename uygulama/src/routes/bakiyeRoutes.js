const express = require('express');
const bakiyeController = require('../controllers/bakiyeController');
const { oturumGerekli } = require('../middleware/oturum');

const router = express.Router();

router.get('/bakiye', oturumGerekli, bakiyeController.durum);
router.post('/bakiye/yukle', oturumGerekli, bakiyeController.yukle);

module.exports = router;
