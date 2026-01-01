const ModelMessage = require('../models/Message.model');
const ModelUser = require('../models/User.model');


// Envoyer un message
const sendMessage = async (req, res) => {
    try {
        const { receiverId, contenu_message } = req.body;

        const receiver = await ModelUser.findById(receiverId);
        if (!receiver) return res.status(404).json('Destinataire non trouvé !');

        const message = await ModelMessage.create({
            contenu_message,
            sender: req.auth.id,
            receiver: receiverId
        });

        const populatedMessage = await message
            .populate('sender', 'pseudo avatar');

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Récupérer toutes mes conversations
const getConversations = async (req, res) => {
    try {
        const conversations = await ModelMessage.aggregate([
            {
                $match: {
                    $or: [
                        { sender: req.auth.id },
                        { receiver: req.auth.id }
                    ]
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', req.auth.id] },
                            '$receiver',
                            '$sender'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$receiver', req.auth.id] },
                                        { $eq: ['$isRead', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    user: { _id: 1, pseudo: 1, avatar: 1 },
                    lastMessage: { contenu_message: 1, createdAt: 1, isRead: 1 },
                    unreadCount: 1
                }
            },
            { $sort: { 'lastMessage.createdAt': -1 } }
        ]);

        res.status(200).json(conversations);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Récupérer une conversation avec un utilisateur
const getConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const user = await ModelUser.findById(userId);
        if (!user) return res.status(404).json('User not found !');

        const messages = await ModelMessage.find({
            $or: [
                { sender: req.auth.id, receiver: userId },
                { sender: userId, receiver: req.auth.id }
            ]
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'pseudo avatar')
            .populate('receiver', 'pseudo avatar');

        // Marquer comme lus
        await ModelMessage.updateMany(
            { sender: userId, receiver: req.auth.id, isRead: false },
            { isRead: true }
        );

        res.status(200).json(messages.reverse());
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Supprimer un message
const deleteMessage = async (req, res) => {
    try {
        const message = await ModelMessage.findById(req.params.id);

        if (!message) return res.status(404).json('Message not found !');

        await message.deleteOne();

        res.status(200).json('Message supprimé !');
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Compter les messages non lus
const getUnreadCount = async (req, res) => {
    try {
        const count = await ModelMessage.countDocuments({
            receiver: req.auth.id,
            isRead: false
        });

        res.status(200).json({ unreadCount: count });
    } catch (error) {
        res.status(500).json(error.message);
    }
}


module.exports = {
    sendMessage,
    getConversations,
    getConversation,
    deleteMessage,
    getUnreadCount
};
