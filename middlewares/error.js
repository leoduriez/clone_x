const createError = (status, message, details = null) => {
    // Cree une nouvelle instance d'erreur vide
    const error = new Error()
    // Definit le code de l'erreur en fonction du paramètre "status"
    error.status = status;
    // Definit le message de l'erreur
    error.message = message;

    return error;
}

module.exports = createError;
