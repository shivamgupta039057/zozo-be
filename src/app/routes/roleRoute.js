const express = require("express");
const router = express.Router();
const controllers = require("../controllers/roleController");
const responseHandler = require("../../helper/responseHandler");
const validate = require("../../helper/validate");
const auth = require("../../middleware/auth");

// Get Homepage Data

router.get('/getRoles', responseHandler(controllers.getRoles));

module.exports = router;