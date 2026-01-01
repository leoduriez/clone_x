const mongoose = require('mongoose');

const UserSchema = mongoose.Schema(
  {
    pseudo: { 
      type: String, 
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 30
    },
    email: { 
      type: String, 
      required: true, 
      unique: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    avatar: { 
      type: String, 
      default: 'https://via.placeholder.com/150'
    },
    bio: {
      type: String,
      maxlength: 160,
      default: ''
    },
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user'
    }
  },
  { timestamps: { createdAt: true } }
)

module.exports = mongoose.model('User', UserSchema);
