const express = require('express');
const router = express.Router();

// IMPORTATION DU CONTROLLER
const TweetController = require('../controllers/Tweet.controller');

// IMPORTATION DU MIDDLEWARE AUTH
const verifyToken = require('../middlewares/auth');


// Routes publiques
router.get('/', TweetController.getAllTweets);
router.get('/search', TweetController.searchTweets);
router.get('/trending', TweetController.getTrending);
router.get('/user/:userId', TweetController.getUserTweets);
router.get('/:id', TweetController.getTweetById);

// Routes protégées
router.post('/', verifyToken, TweetController.createTweet);
router.put('/:id', verifyToken, TweetController.updateTweet);
router.delete('/:id', verifyToken, TweetController.deleteTweet);

// Feed personnalisé
router.get('/feed/me', verifyToken, TweetController.getFeed);

// Réponses
router.post('/:id/reply', verifyToken, TweetController.replyToTweet);

// Retweets
router.post('/:id/retweet', verifyToken, TweetController.retweet);
router.delete('/:id/retweet', verifyToken, TweetController.undoRetweet);

// Likes
router.post('/:id/like', verifyToken, TweetController.likeTweet);
router.delete('/:id/like', verifyToken, TweetController.unlikeTweet);


module.exports = router;
