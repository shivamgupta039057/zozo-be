const express = require("express");
const router = express.Router();
const controllers = require("../controllers/userController");
const responseHandler = require("../../helper/responseHandler");
const validate = require("../../helper/validate");
const auth = require("../../middleware/auth");
const {addUserVal } = require("../../validators/app/userVal");
// Get Homepage Data


router.post('/addUser', validate(addUserVal), responseHandler(controllers.addUser)); // public
router.post('/send-otp-email' , responseHandler(controllers.sendotpEmail) )
router.post('/login', responseHandler(controllers.login)); // public

router.get('/getUser', auth, responseHandler(controllers.getUserList));
router.post('/editUser/:id', auth, responseHandler(controllers.editUser));
router.get('/profile', auth, responseHandler(controllers.getProfile));


module.exports = router;