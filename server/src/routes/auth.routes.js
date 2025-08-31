const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

router.post('/check-email', ctrl.checkEmail);
router.post('/send-reset-code', ctrl.sendResetCode);
router.post('/verify-reset-code', ctrl.verifyResetCode);
router.post('/reset-password', ctrl.resetPassword);

module.exports = router;
