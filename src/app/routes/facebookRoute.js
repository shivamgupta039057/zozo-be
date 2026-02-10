// const express = require('express');
// const router = express.Router();
// const FacebookController = require('../controllers/FacebookController');
// const express = require('express');
// const router = express.Router();
// const FacebookController = require('../controllers/FacebookController');



// // Get user pages
// router.get('/pages', FacebookController.getUserPages);

// // Get leadgen forms for a page
// router.get('/leadgen_forms/:pageId', FacebookController.getLeadgenForms);

// // Get questions for a form
// router.get('/form_questions/:formId', FacebookController.getFormQuestions);

// module.exports = router;

// // Facebook Webhook Callback (GET for verification, POST for events)
// router.get('/webhook', FacebookController.facebookWebhookVerify);
// router.post('/webhook', FacebookController.facebookWebhookEvent);

// // OAuth callback (FIRST API EVER HIT)
// router.get("/callback", FacebookController.callback);

// // Save selected page
// // router.post("/page/select", FacebookController.selectPage);

// // // Save selected form
// // router.post("/form/select", FacebookController.selectForm);

// // // Save field mapping
// // router.post("/form/mapping", FacebookController.saveMapping);

const responseHandler = require("../../helper/responseHandler");
const express = require('express');
const router = express.Router();
const FacebookController = require('../controllers/FacebookController');
const auth=require('../../middleware/auth');
// 🔹 OAuth callback (FIRST HIT)
router.get('/callback', FacebookController.callback);

// 🔹 Facebook data fetch (FB APIs)
router.get('/pages', FacebookController.getUserPages);
router.get('/leadgen_forms/:pageId', FacebookController.getLeadgenForms);
router.get('/form_questions/:formId', FacebookController.getFormQuestions);



router.post('/integrations',auth,FacebookController.createIntegration);

// 🔹 Integration mappings
router.post('/integrations/:id/mappings',auth, FacebookController.saveIntegrationMappings);

router.post('/integrations/:integrationId/lead-distribution',auth, FacebookController.saveLeadDistribution);


// 🔹 Webhook
router.get('/webhook', FacebookController.facebookWebhookVerify);
router.post('/webhook', FacebookController.facebookWebhookEvent);

module.exports = router;
