const express = require('express');
const router = express.Router();

// IMPORTATION DU CONTROLLER
const MessageController = require('../controllers/Message.controller');

// IMPORTATION DU MIDDLEWARE AUTH
const verifyToken = require('../middlewares/auth');


// Toutes les routes sont protégées
router.use(verifyToken);

router.post('/', MessageController.sendMessage);
router.get('/conversations', MessageController.getConversations);
router.get('/conversation/:userId', MessageController.getConversation);
router.get('/unread', MessageController.getUnreadCount);
router.delete('/:id', MessageController.deleteMessage);


module.exports = router;
