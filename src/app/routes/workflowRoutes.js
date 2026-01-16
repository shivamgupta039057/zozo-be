const express = require("express");
const router = express.Router();
const controller = require("../controllers/workflowController");
const responseHandler = require("../../helper/responseHandler");
const validate = require("../../helper/validate");
const { leadValidation } = require("../../validators/app/leadVal.js");
const upload = require('../../helper/multer');
const { uploadFile } = require("../../helper/fileUploader");
const auth = require("../../middleware/auth");

router.post('/addWorkflow', auth, responseHandler(controller.createWorkFlowController));
router.get('/getWorkFlow', auth, responseHandler(controller.getWorkFlowController));
// new workflow data
router.post('/saveWorkflow', auth, responseHandler(controller.saveWorkFlowController));



module.exports = router;

