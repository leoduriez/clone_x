const ModelUser = require('../models/User.model');
const createError = require('../middlewares/error');


const checkIsAdmin = async (userId) => {
    const user = await ModelUser.findById(userId);
    if (!user) {
        throw createError(404, "Utilisateur non trouvé !");
    }
    if (user.role !== 'admin') {
        throw createError(401, "Non autorisé !");
    }
    return true;
};

const checkUserExists = async (userId) => {
    const user = await ModelUser.findById(userId);
    if (!user) {
        throw createError(404, "Utilisateur non trouvé !");
    }
    return user;
};

module.exports = {
    checkIsAdmin,
    checkUserExists
};
