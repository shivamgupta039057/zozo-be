const express = require("express");
const router = express.Router();
const controller = require("../controllers/whatsappController.js");
const responseHandler = require("../../helper/responseHandler");
const validate = require("../../helper/validate");
const { leadValidation } = require("../../validators/app/leadVal.js");
const upload = require('../../helper/multer');
const { uploadFile } = require("../../helper/fileUploader");
const auth = require("../../middleware/auth");

router.get('/webhook', responseHandler(controller.verifyWebhook)); // public
router.post('/webhook', responseHandler(controller.receiveMessage)); // public
// new workflow data
router.post('/send-text', auth, responseHandler(controller.sendText));
router.post('/send-template', auth, responseHandler(controller.sendTemplate));

router.get('/chats', auth, responseHandler(controller.getChat));
router.get('/get-template', responseHandler(controller.getTemplates));
router.post('/create-template', auth, responseHandler(controller.createTemplate));
router.get('/messages/:id', auth, responseHandler(controller.getMessagesByChatId));



module.exports = router;