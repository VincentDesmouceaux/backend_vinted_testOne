// Force rebuild
require("dotenv").config();


const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const stripe = require("stripe")(process.env.STRIPE_KEY);

app.use(cors());

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");

app.use(offerRoutes);

app.use(userRoutes);

app.post("/payment", async (req, res) => {
  try {
    console.log(req.body);

    const { amount, currency, description } = req.body;
    const stripeToken = req.body.stripeToken;
    const response = await stripe.charges.create({
      amount: amount,
      currency: "eur",
      description: description,
      source: stripeToken,
    });
    console.log(response);

    res.json(response.status);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route doesn't exist" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
