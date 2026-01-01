const mongoose = require('mongoose');

const TweetSchema = mongoose.Schema(
  {
    contenu: {
      type: String,
      required: true,
      maxlength: 280
    },
    media_url: {
      type: String,
      default: null
    },
    // Relation PUBLIER : Un tweet appartient à un utilisateur
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Relation LIKER : Un tweet peut être liké par plusieurs utilisateurs (0,N)
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // Relation réflexive REPONDRE : Un tweet peut répondre à un autre tweet (0,N)
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tweet',
      default: null
    },
    // Système de Retweet : Référence au tweet original
    retweetOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tweet',
      default: null
    },
    // Utilisateurs qui ont retweeté ce tweet
    retweets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // Type de tweet pour faciliter le filtrage
    tweetType: {
      type: String,
      enum: ['original', 'reply', 'retweet'],
      default: 'original'
    }
  },
  { timestamps: { createdAt: true } }
)

module.exports = mongoose.model('Tweet', TweetSchema);
