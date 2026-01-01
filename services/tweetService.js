const ModelTweet = require('../models/Tweet.model');
const createError = require('../middlewares/error');


const checkTweetExists = async (tweetId) => {
    const tweet = await ModelTweet.findById(tweetId);
    if (!tweet) {
        throw createError(404, "Aucun Tweet trouvé !");
    }
    return tweet;
};

const checkIsAuthor = async (tweetId, userId) => {
    const tweet = await ModelTweet.findById(tweetId);
    if (!tweet) {
        throw createError(404, "Aucun Tweet trouvé !");
    }
    return tweet;
};

module.exports = {
    checkTweetExists,
    checkIsAuthor
};
