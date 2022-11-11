const express = require("express");
const router = express.Router();

const fileUpload = require("express-fileupload");
const isAuthenticated = require("../middlewares/isAuthenticated");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "duonbvcpi",
  api_key: "745913231429459",
  api_secret: "UxiWWLwVPxi6Q64lbqc_JDg8S-E",
  secure: true,
});

const convertToBase64 = (file) => {
  //console.log(file);

  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

const Offer = require("../models/Offer");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const pictureConverted = convertToBase64(req.files.picture);

      const result = await cloudinary.uploader.upload(pictureConverted, {
        folder: "/vinted",
      });

      const {
        title,
        description,
        price,
        condition,
        city,
        brand,
        size,
        color,
        picture,
      } = req.body;
      //console.log(req.user);
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ETAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        product_image: result,
        owner: req.user,
      });

      await newOffer.save();

      //console.log(newOffer);
      res.json(newOffer);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;

    const filters = {};
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }

    if (priceMin) {
      filters.product_price = { $gte: Number(priceMin) };
    }

    // console.log(filters);
    if (priceMax) {
      if (!filters.product_price) {
        filters.product_price = { $lte: Number(priceMax) };
      } else {
        filters.product_price.$lte = Number(priceMax);
      }
    }
    // console.log(filters);

    const sortFilter = {};
    if (sort === "price-desc") {
      sortFilter.product_price = "desc";
    } else if (sort === "price-asc") {
      sortFilter.product_price = "asc";
    }

    // 5 resultats par page : 1 skip 0, 2 skip 5, 3 skip 10, 4 skip 15
    // 3 resultats par page : 1 skip 0, 2 skip 3, 3 skip 6, 4 skip 9
    const limit = 10;
    let pageRequired = 1;
    if (page) {
      pageRequired = Number(page);
    }

    const skip = (pageRequired - 1) * limit;

    const offers = await Offer.find(filters)
      .sort(sortFilter)
      .skip(skip)
      .limit(limit)
      // .select("product_name product_price owner")
      .populate("owner", "account _id");

    const offerCount = await Offer.countDocuments(filters);
    console.log(offerCount);

    res.json({ count: offerCount, offers: offers });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    console.log(req.params);
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account _id"
    );
    res.json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
