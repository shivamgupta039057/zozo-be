// const FacebookService = require('../services/facebookService');
// const axios = require('axios');
// module.exports = {
//   // GET /facebook/pages
//   async getUserPages(req, res) {
//     const { access_token } = req.query;
//     const response = await FacebookService.getUserPages(access_token);
//     res.status(response.statusCode).json(response);
//   },

//   // GET /facebook/leadgen_forms/:pageId
//   async getLeadgenForms(req, res) {
//     const { access_token } = req.query;
//     const { pageId } = req.params;
//     const response = await FacebookService.getLeadgenForms(pageId, access_token);
//     res.status(response.statusCode).json(response);
//   },

//   // GET /facebook/form_questions/:formId
//   async getFormQuestions(req, res) {
//     const { access_token } = req.query;
//     const { formId } = req.params;
//     const response = await FacebookService.getFormQuestions(formId, access_token);
//     res.status(response.statusCode).json(response);
//   },

//   // 🔹 OAuth callback
//   async callback(req, res) {
//     try {
//       const result = await FacebookService.handleCallback(req);
//       return res.redirect(
//         `${process.env.FRONTEND_URL}/integrations/facebook?connected=true`
//       );
//     } catch (err) {
//       console.error(err);
//       return res.status(500).send("Facebook callback failed");
//     }
//   }

// };

// // Facebook Webhook Verification (GET)
// module.exports.facebookWebhookVerify = (req, res) => {
//   const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'visuti_random_1234';
//   const mode = req.query['hub.mode'];
//   const token = req.query['hub.verify_token'];
//   const challenge = req.query['hub.challenge'];
//   if (mode && token) {
//     if (mode === 'subscribe' && token === VERIFY_TOKEN) {
//       return res.status(200).send(challenge);
//     } else {
//       return res.sendStatus(403);
//     }
//   }
//   res.sendStatus(400);
// };

// // Facebook Webhook Event (POST)
// module.exports.facebookWebhookEvent = async (req, res) => {
//   try {
//     await FacebookService.handleWebhookEvent(req.body);
//     res.sendStatus(200);
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }

// };

// //   module.exports.callback = async (req, res) => {
// //   const code = req.query.code;
// //   if (!code) return res.send("No code received");
// // console.log("FB Callback code:", code);
// //   const tokenRes = await axios.get(
// //     "https://graph.facebook.com/v17.0/oauth/access_token",
// //     {
// //       params: {
// //         client_id: process.env.FB_APP_ID,
// //         client_secret: process.env.FB_APP_SECRET,
// //         redirect_uri: process.env.FB_REDIRECT_URI,
// //         code
// //       }
// //     }
// //   );

// //   const { access_token, expires_in } = tokenRes.data;
// // console.log("FB Access Token:", access_token, "Expires in:", expires_in);
// //   if (!access_token) return res.send("Failed to get access token");
// //   // save access_token in DB here

// //   res.redirect("https://frontend.yourdomain.com/integrations/facebook");
// // };

const FacebookService = require('../services/facebookService');

module.exports = {
  /**
   * POST /facebook/integrations/:id/mappings
   * Bulk create field mappings for a Facebook integration
   */

  // OAuth callback
  async callback(req, res) {
    try {
      await FacebookService.handleCallback(req);
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/facebook?connected=true`
      );
    } catch (err) {
      console.error(err);
      res.status(500).send("Facebook callback failed");
    }
  },

  // Facebook APIs (read-only)
  async getUserPages(req, res) {
    const response = await FacebookService.getUserPages();
    res.status(response.statusCode).json(response);
  },

  async getLeadgenForms(req, res) {
    const response = await FacebookService.getLeadgenForms(
      req.params.pageId,
      req.query.access_token
    );
    res.status(response.statusCode).json(response);
  },

  async getFormQuestions(req, res) {
    const response = await FacebookService.getFormQuestions(
      req.params.formId,
      req.query.access_token
    );
    res.status(response.statusCode).json(response);
  },



  /**
   * POST /facebook/integrations
   * Create a Facebook Integration
   */
  async createIntegration(req, res) {
    try {
      const { page, form } = req.body;
      const integration = await FacebookService.createIntegration({
        userId: req.user.id,
        page,
        form,
        pageAccessToken: process.env.FB_ACCESS_TOKEN
      });
      res.json(integration);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },


  async saveIntegrationMappings(req, res) {
    try {
      const integrationId = req.params.id;
      const { mappings } = req.body;
      await FacebookService.saveIntegrationMappings(integrationId, mappings);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async saveLeadDistribution(req, res) {
    try {
      const { integrationId } = req.params;
      const { users } = req.body;

      if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({ message: 'Users required' });
      }

      const total = users.reduce((s, u) => s + u.percentage, 0);
      if (total !== 100) {
        return res.status(400).json({ message: 'Percentages must sum to 100' });
      }

      await FacebookService.saveLeadDistributionRules(
        Number(integrationId),
        users
      );

      res.json({ success: true, message: 'Distribution saved' });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },




  // Webhook verify
  facebookWebhookVerify(req, res) {
    const token = process.env.FB_VERIFY_TOKEN;
    if (
      req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === token
    ) {
      return res.status(200).send(req.query['hub.challenge']);
    }
    res.sendStatus(403);
  },

  // Webhook receive
  // async facebookWebhookEvent(req, res) {
  //   await FacebookService.handleWebhook(req,res);
  //   res.sendStatus(200);
  // }


  async facebookWebhookEvent(req, res) {
    try {
      console.log('Received Facebook webhook event:', JSON.stringify(req.body));
      await FacebookService.handleWebhook(req, res);
      res.json({ success: true, message: 'Webhook event processed' });
    } catch (err) {
      console.error('Webhook processing error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },
};




