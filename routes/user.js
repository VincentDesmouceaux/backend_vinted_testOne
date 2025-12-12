const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  const { username, email, password, newsletter } = req.body;

  try {
    const isMailExistInDb = await User.findOne({ email: email });

    if (isMailExistInDb !== null) {
      return res.status(400).json({ message: "mail déja existant !" });
    }

    if (!username) {
      return res
        .status(402)
        .json({ message: "le username n'est pas renseigné" });
    }

    if (!email) {
      return res.status(403).json({ message: "le mail n'est pas renseigné" });
    }

    const salt = uid2(16);

    const hash = SHA256(salt + password).toString(encBase64);

    const token = uid2(64);

    const newUser = new User({
      email: email,
      account: {
        username: username,
      },
      newsletter: newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });
    await newUser.save();

    console.log(newUser);
    res.json({
      _id: newUser._id,
      token: newUser.token,
      account: {
        username: newUser.account.username,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Vérifier les champs
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    // 2) Chercher l'utilisateur
    const user = await User.findOne({ email: email });

    if (!user) {
      // Email inconnu
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 3) Recalculer le hash
    const newHash = SHA256(user.salt + password).toString(encBase64);

    if (newHash !== user.hash) {
      // Mot de passe incorrect
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 4) OK → renvoyer les infos utilisateur
    console.log("On peut se connecter");
    return res.json({
      _id: user._id,
      token: user.token,
      account: {
        username: user.account.username,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
