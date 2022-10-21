const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    // je vais chercher mon token et j'enlève "Bearer "
    const token = req.headers.authorization.replace("Bearer ", "");

    // Je vais chercher en BDD un user dont le token est celui qu'on a reçu
    // J'entrouve un
    const user = await User.findOne({ token }).select("account");
    // Si je n'en trouve pas, message d'erreur
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Si j'en trouve un, je le stocke dans req.user pour pouvoir le réutiliser dans ma route
    req.user = user;
    // Je passe au middleware suivant
    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
