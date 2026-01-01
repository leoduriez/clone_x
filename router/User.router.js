const express = require('express');
const router = express.Router();

// IMPORTATION DU CONTROLLER
const UserController = require('../controllers/User.controller');

// IMPORTATION DU MIDDLEWARE AUTH
const verifyToken = require('../middlewares/auth');


// Routes publiques
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/search', UserController.searchUsers);
router.get('/:id', UserController.getUser);
router.get('/:id/followers', UserController.getFollowers);
router.get('/:id/following', UserController.getFollowing);

// Routes protégées
router.post('/logout', verifyToken, UserController.logout);
router.get('/profile/me', verifyToken, UserController.getMe);
router.put('/profile/me', verifyToken, UserController.updateMe);
router.post('/:id/follow', verifyToken, UserController.follow);
router.delete('/:id/follow', verifyToken, UserController.unfollow);


module.exports = router;
