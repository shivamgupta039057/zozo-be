const express = require("express");
const router = express.Router();
const controller = require("../controllers/brodcasteController")
const responseHandler = require("../../helper/responseHandler");
const auth = require("../../middleware/auth");



router.post("/createBrodcaste", auth, responseHandler(controller.createBrodcaste));
router.post("/:id/start", auth, responseHandler(controller.startBroadcast));


module.exports = router;