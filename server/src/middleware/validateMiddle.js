const { body, validationResult } = require("express-validator");

const validateContact = [
  body("fullName").notEmpty().withMessage("Full Name is required"),
  body("email").isEmail().withMessage("Valid Email is required"),
  body("phoneNumber").notEmpty().withMessage("Phone Number is required"),
  body("whatsappNumber").notEmpty().withMessage("WhatsApp Number is required"),
  body("cityName").notEmpty().withMessage("City Name is required"),
  body("countryName").notEmpty().withMessage("Country Name is required"),
  body("message").notEmpty().withMessage("Message is required"),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || "Validation failed",
        errors: errors.array(),
      });
    }

    next();
  },
];

module.exports = validateContact;
