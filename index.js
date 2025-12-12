// Force rebuild / variables d'environnement
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_KEY);

const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());

// Préparation au changement de Mongoose 7 (supprime le warning)
mongoose.set("strictQuery", false);

// Connexion MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connecté");
  })
  .catch((error) => {
    console.error("❌ Erreur de connexion MongoDB :", error.message);
  });

// Routes
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");

// On peut mettre user puis offer (ordre plus logique, mais pas obligatoire)
app.use(userRoutes);
app.use(offerRoutes);

// Route paiement Stripe
app.post("/payment", async (req, res) => {
  try {
    console.log("PAYMENT BODY:", req.body);

    const { amount, currency, description, stripeToken } = req.body;

    const response = await stripe.charges.create({
      amount,
      currency: currency || "eur",
      description,
      source: stripeToken,
    });

    console.log("STRIPE RESPONSE:", response);

    res.json(response.status);
  } catch (error) {
    console.error("PAYMENT ERROR:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// Catch-all pour les routes inconnues
app.all("*", (req, res) => {
  res.status(404).json({ message: "This route doesn't exist" });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
