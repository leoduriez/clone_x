const ModelUser = require('../models/User.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ENV = require('../config/env');


// Inscription
const register = async (req, res) => {
    try {
        const hashPassword = await bcrypt.hash(req.body.password, 10);

        const user = await ModelUser.create({
            ...req.body,
            password: hashPassword
        });

        const { password, ...userWithoutPassword } = user._doc;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Connexion
const login = async (req, res) => {
    try {
        const user = await ModelUser.findOne({ email: req.body.email });

        if (!user) return res.status(404).json('Utilisateur non trouvé !');

        const hashCompare = await bcrypt.compare(req.body.password, user.password);

        if (!hashCompare) {
            return res.status(400).json('Mauvais identifiants !');
        }
        
        const token = jwt.sign(
            { id: user._id },
            ENV.TOKEN,
            { expiresIn: "24h" }
        );

        const { password, ...others } = user._doc;

        res.cookie(
            'access_token',
            token,
            { httpOnly: true }
        )
        .status(200)
        .json(others);

    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Déconnexion
const logout = async (req, res) => {
    try {
        res.clearCookie('access_token');
        res.status(200).json('Déconnexion réussie !');
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Récupérer mon profil
const getMe = async (req, res) => {
    try {
        const user = await ModelUser.findById(req.auth.id)
            .select('-password')
            .populate('followers', 'pseudo avatar')
            .populate('following', 'pseudo avatar');

        if (!user) return res.status(404).json('Utilisateur non trouvé !');

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Récupérer un profil par ID
const getUser = async (req, res) => {
    try {
        const user = await ModelUser.findById(req.params.id)
            .select('-password')
            .populate('followers', 'pseudo avatar')
            .populate('following', 'pseudo avatar');

        if (!user) return res.status(404).json('Utilisateur non trouvé !');

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Modifier mon profil
const updateMe = async (req, res) => {
    try {
        const { pseudo, bio, avatar } = req.body;

        const user = await ModelUser.findByIdAndUpdate(
            req.auth.id,
            { pseudo, bio, avatar },
            { new: true }
        ).select('-password');

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Suivre un utilisateur
const follow = async (req, res) => {
    try {
        const userToFollow = await ModelUser.findById(req.params.id);

        if (!userToFollow) return res.status(404).json('Utilisateur non trouvé !');

        const currentUser = await ModelUser.findById(req.auth.id);

        if (currentUser.following.includes(userToFollow._id)) {
            return res.status(400).json('Vous suivez déjà cet utilisateur');
        }

        await ModelUser.findByIdAndUpdate(req.auth.id, {
            $push: { following: userToFollow._id }
        });

        await ModelUser.findByIdAndUpdate(userToFollow._id, {
            $push: { followers: req.auth.id }
        });

        res.status(200).json(`Vous suivez maintenant @${userToFollow.pseudo}`);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Ne plus suivre un utilisateur
const unfollow = async (req, res) => {
    try {
        const userToUnfollow = await ModelUser.findById(req.params.id);

        if (!userToUnfollow) return res.status(404).json('Utilisateur non trouvé !');

        await ModelUser.findByIdAndUpdate(req.auth.id, {
            $pull: { following: userToUnfollow._id }
        });

        await ModelUser.findByIdAndUpdate(userToUnfollow._id, {
            $pull: { followers: req.auth.id }
        });

        res.status(200).json(`Vous ne suivez plus @${userToUnfollow.pseudo}`);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Récupérer les followers d'un utilisateur
const getFollowers = async (req, res) => {
    try {
        const user = await ModelUser.findById(req.params.id)
            .populate('followers', 'pseudo avatar bio');

        if (!user) return res.status(404).json('Utilisateur non trouvé !');

        res.status(200).json(user.followers);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Récupérer les following d'un utilisateur
const getFollowing = async (req, res) => {
    try {
        const user = await ModelUser.findById(req.params.id)
            .populate('following', 'pseudo avatar bio');

        if (!user) return res.status(404).json('Utilisateur non trouvé !');

        res.status(200).json(user.following);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


// Rechercher des utilisateurs
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) return res.status(400).json('Veuillez fournir un terme de recherche');

        const users = await ModelUser.find({
            $or: [
                { pseudo: { $regex: q, $options: 'i' } },
                { bio: { $regex: q, $options: 'i' } }
            ]
        })
            .select('pseudo avatar bio followers following')
            .limit(20);

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json(error.message);
    }
}


module.exports = {
    register,
    login,
    logout,
    getMe,
    getUser,
    updateMe,
    follow,
    unfollow,
    getFollowers,
    getFollowing,
    searchUsers
};
