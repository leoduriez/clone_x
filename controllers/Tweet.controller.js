const ModelTweet = require('../models/Tweet.model');
const ModelUser = require('../models/User.model');


// Créer un tweet
const createTweet = async (req, res) => {
    try {
        const tweet = await ModelTweet.create({
            contenu: req.body.contenu,
            media_url: req.body.media_url,
            author: req.auth.id,
            tweetType: 'original'
        });

        const populatedTweet = await tweet.populate('author', 'pseudo avatar');

        res.status(201).json(populatedTweet);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Récupérer tous les tweets (feed public)
const getAllTweets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const tweets = await ModelTweet.find({ tweetType: { $ne: 'reply' } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'pseudo avatar')
            .populate({
                path: 'retweetOf',
                populate: { path: 'author', select: 'pseudo avatar' }
            });

        const total = await ModelTweet.countDocuments({ tweetType: { $ne: 'reply' } });

        res.status(200).json({
            tweets,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Récupérer un tweet par ID
const getTweetById = async (req, res) => {
    try {
        const tweet = await ModelTweet.findById(req.params.id)
            .populate('author', 'pseudo avatar')
            .populate('likes', 'pseudo avatar')
            .populate({
                path: 'replyTo',
                populate: { path: 'author', select: 'pseudo avatar' }
            });

        if (!tweet) return res.status(404).json('Tweet non trouvé !');

        // Récupérer les réponses
        const replies = await ModelTweet.find({ replyTo: tweet._id })
            .sort({ createdAt: -1 })
            .populate('author', 'pseudo avatar');

        res.status(200).json({ tweet, replies });
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Modifier un tweet
const updateTweet = async (req, res) => {
    try {
        const tweet = await ModelTweet.findById(req.params.id);

        if (!tweet) return res.status(404).json('Tweet non trouvé !');

        tweet.contenu = req.body.contenu || tweet.contenu;
        tweet.media_url = req.body.media_url !== undefined ? req.body.media_url : tweet.media_url;
        await tweet.save();

        const populatedTweet = await tweet.populate('author', 'pseudo avatar');

        res.status(200).json(populatedTweet);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Supprimer un tweet
const deleteTweet = async (req, res) => {
    try {
        const tweet = await ModelTweet.findById(req.params.id);

        if (!tweet) return res.status(404).json('Tweet non trouvé !');

        // Supprimer aussi les réponses
        await ModelTweet.deleteMany({ replyTo: tweet._id });
        await tweet.deleteOne();

        res.status(200).json('Tweet supprimé !');
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Répondre à un tweet
const replyToTweet = async (req, res) => {
    try {
        const parentTweet = await ModelTweet.findById(req.params.id);

        if (!parentTweet) return res.status(404).json('Tweet non trouvé !');

        const reply = await ModelTweet.create({
            contenu: req.body.contenu,
            media_url: req.body.media_url,
            author: req.auth.id,
            replyTo: parentTweet._id,
            tweetType: 'reply'
        });

        const populatedReply = await reply.populate('author', 'pseudo avatar');

        res.status(201).json(populatedReply);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Retweeter
const retweet = async (req, res) => {
    try {
        const originalTweet = await ModelTweet.findById(req.params.id);

        if (!originalTweet) return res.status(404).json('Tweet non trouvé !');

        if (originalTweet.retweets.includes(req.auth.id)) {
            return res.status(400).json('Vous avez déjà retweeté ce tweet');
        }

        const newRetweet = await ModelTweet.create({
            contenu: originalTweet.contenu,
            author: req.auth.id,
            retweetOf: originalTweet._id,
            tweetType: 'retweet'
        });

        originalTweet.retweets.push(req.auth.id);
        await originalTweet.save();

        const populatedRetweet = await newRetweet.populate('author', 'pseudo avatar');

        res.status(201).json(populatedRetweet);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Annuler un retweet
const undoRetweet = async (req, res) => {
    try {
        const originalTweet = await ModelTweet.findById(req.params.id);

        if (!originalTweet) return res.status(404).json('Tweet non trouvé !');

        await ModelTweet.findOneAndDelete({
            author: req.auth.id,
            retweetOf: originalTweet._id
        });

        originalTweet.retweets = originalTweet.retweets.filter(
            id => id.toString() !== req.auth.id
        );
        await originalTweet.save();

        res.status(200).json('Retweet annulé !');
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Liker un tweet
const likeTweet = async (req, res) => {
    try {
        const tweet = await ModelTweet.findById(req.params.id);

        if (!tweet) return res.status(404).json('Tweet non trouvé !');

        if (tweet.likes.includes(req.auth.id)) {
            return res.status(400).json('Vous avez déjà liké ce tweet');
        }

        tweet.likes.push(req.auth.id);
        await tweet.save();

        res.status(200).json({ message: 'Tweet liké !', likesCount: tweet.likes.length });
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Unliker un tweet
const unlikeTweet = async (req, res) => {
    try {
        const tweet = await ModelTweet.findById(req.params.id);

        if (!tweet) return res.status(404).json('Tweet non trouvé !');

        if (!tweet.likes.includes(req.auth.id)) {
            return res.status(400).json('Vous n\'avez pas liké ce tweet');
        }

        tweet.likes = tweet.likes.filter(id => id.toString() !== req.auth.id);
        await tweet.save();

        res.status(200).json({ message: 'Like retiré !', likesCount: tweet.likes.length });
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Récupérer les tweets d'un utilisateur
const getUserTweets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const tweets = await ModelTweet.find({ author: req.params.userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'pseudo avatar');

        const total = await ModelTweet.countDocuments({ author: req.params.userId });

        res.status(200).json({ tweets, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Feed personnalisé (tweets des personnes suivies)
const getFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const currentUser = await ModelUser.findById(req.auth.id);
        const following = [...currentUser.following, req.auth.id];

        const tweets = await ModelTweet.find({
            author: { $in: following },
            tweetType: { $ne: 'reply' }
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'pseudo avatar')
            .populate({
                path: 'retweetOf',
                populate: { path: 'author', select: 'pseudo avatar' }
            });

        const total = await ModelTweet.countDocuments({
            author: { $in: following },
            tweetType: { $ne: 'reply' }
        });

        res.status(200).json({ tweets, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Rechercher des tweets
const searchTweets = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) return res.status(400).json('Veuillez fournir un terme de recherche');

        const tweets = await ModelTweet.find({
            contenu: { $regex: q, $options: 'i' },
            tweetType: { $ne: 'retweet' }
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('author', 'pseudo avatar');

        res.status(200).json(tweets);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Tweets tendances (les plus likés des dernières 24h)
const getTrending = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const tweets = await ModelTweet.aggregate([
            {
                $match: {
                    tweetType: { $ne: 'retweet' },
                    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            },
            {
                $addFields: {
                    popularity: {
                        $add: [
                            { $size: '$likes' },
                            { $multiply: [{ $size: '$retweets' }, 2] }
                        ]
                    }
                }
            },
            { $sort: { popularity: -1 } },
            { $limit: limit }
        ]);

        const populatedTweets = await ModelTweet.populate(tweets, {
            path: 'author',
            select: 'pseudo avatar'
        });

        res.status(200).json(populatedTweets);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


module.exports = {
    createTweet,
    getAllTweets,
    getTweetById,
    updateTweet,
    deleteTweet,
    replyToTweet,
    retweet,
    undoRetweet,
    likeTweet,
    unlikeTweet,
    getUserTweets,
    getFeed,
    searchTweets,
    getTrending
};
