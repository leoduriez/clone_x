const mongoose = require('mongoose');

const MessageSchema = mongoose.Schema(
  {
    contenu_message: {
      type: String,
      required: true,
      maxlength: 1000
    },
    // Relation ENVOYER : L'expéditeur du message
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Relation RECEVOIR : Le destinataire du message
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Statut de lecture
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: { createdAt: true } }
)

module.exports = mongoose.model('Message', MessageSchema);
