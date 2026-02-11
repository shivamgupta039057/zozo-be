// const { getRequest } = require('../helper/axiosHelper');
// require('dotenv').config();
// const { FacebookConnection, FacebookPage, FacebookForm,FacebookFormField,CrmField,FbFieldMapping,Campaign,RawFacebookLead } = require('../../pgModels/index')
// const BASE_URL = 'https://graph.facebook.com/v24.0';
// const DEFAULT_FB_TOKEN = process.env.FB_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;

// const { statusCode } = require("../../config/default.json");

// module.exports = {
//   async getUserPages(access_token) {
//     try {
//       const token = access_token || DEFAULT_FB_TOKEN;
//       if (!token) throw new Error('Access token is required');
//       const url = `${BASE_URL}/me/accounts`;
//       const data = await getRequest(url, { access_token: token });
//       return {
//         statusCode: statusCode.OK,
//         success: true,
//         message: "Facebook user pages fetched successfully",
//         data,
//       };
//     } catch (error) {
//       return {
//         statusCode: statusCode.BAD_REQUEST,
//         success: false,
//         message: error.message,
//       };
//     }
//   },

//   async getLeadgenForms(pageId, access_token) {
//     try {
//       const token = access_token;
//       if (!token) throw new Error('Access token is required');
//       if (!pageId) throw new Error('Page ID is required');
//       const url = `${BASE_URL}/${pageId}/leadgen_forms`;
//       const data = await getRequest(url, { access_token: token });
//       return {
//         statusCode: statusCode.OK,
//         success: true,
//         message: "Facebook leadgen forms fetched successfully",
//         data,
//       };
//     } catch (error) {
//       return {
//         statusCode: statusCode.BAD_REQUEST,
//         success: false,
//         message: error.message,
//       };
//     }
//   },

//   async getFormQuestions(formId, access_token) {
//     try {
//       const token = access_token;
//       if (!token) throw new Error('Access token is required');
//       if (!formId) throw new Error('Form ID is required');
//       const url = `${BASE_URL}/${formId}`;
//       const data = await getRequest(url, { fields: 'questions', access_token: token });
//       return {
//         statusCode: statusCode.OK,
//         success: true,
//         message: "Facebook form questions fetched successfully",
//         data,
//       };
//     } catch (error) {
//       return {
//         statusCode: statusCode.BAD_REQUEST,
//         success: false,
//         message: error.message,
//       };
//     }
//   },



//   // 🔹 Handle OAuth callback
//   async handleCallback(req) {
//     const code = req.query.code;
//     if (!code) throw new Error("No code received");

//     // Exchange code → access_token
//     const tokenRes = await axios.get(
//       "https://graph.facebook.com/v17.0/oauth/access_token",
//       {
//         params: {
//           client_id: process.env.FB_APP_ID,
//           client_secret: process.env.FB_APP_SECRET,
//           redirect_uri: process.env.FB_REDIRECT_URI,
//           code
//         }
//       }
//     );

//     const { access_token, expires_in } = tokenRes.data;

//     // Get fb user id
//     const meRes = await axios.get(
//       "https://graph.facebook.com/me",
//       { params: { access_token } }
//     );

//     const fb_user_id = meRes.data.id;
//     const token_expires_at = new Date(Date.now() + expires_in * 1000);

//     // Save connection
//     await FacebookConnection.upsert({
//       user_id: req.user.id,
//       fb_user_id,
//       access_token,
//       token_expires_at
//     });
//   },

//   // Facebook Webhook Event Handler
//   async handleWebhookEvent(body) {
//     // You can log or process the webhook event here
//     // For now, just log the event
//     console.log('Facebook Webhook Event:', JSON.stringify(body));
//     // TODO: Add custom logic to process events as needed
//     return true;
//   },
// };


const { getRequest } = require('../helper/axiosHelper');
require('dotenv').config();
const { fetchFacebookLead, applyFieldMapping, assignLeadByPercentage } = require('../helper/facebookHelper');
const { sequelize,
  FacebookConnection, FacebookIntegration,
  FbFieldMapping, FbLeadDistributionState, FbLeadDistributionRule,
  RawFacebookLead,Lead
} = require('../../pgModels/index');

const BASE_URL = 'https://graph.facebook.com/v24.0';
const { statusCode } = require("../../config/default.json");
const { Json } = require('sequelize/lib/utils');

module.exports = {

  /* =========================
     FACEBOOK READ APIs
  ========================== */

  async getUserPages() {
    try {
      // if (!access_token) throw new Error('Access token is required');

      const data = await getRequest(
        `${BASE_URL}/me/accounts`,
        { access_token: process.env.FB_ACCESS_TOKEN }
      );

      return {
        statusCode: statusCode.OK,
        success: true,
        message: "Facebook user pages fetched successfully",
        data
      };

    } catch (error) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: error.message
      };
    }
  },

  async getLeadgenForms(pageId, access_token) {
    try {
      if (!access_token) throw new Error('Access token is required');
      if (!pageId) throw new Error('Page ID is required');

      const data = await getRequest(
        `${BASE_URL}/${pageId}/leadgen_forms`,
        { access_token }
      );

      return {
        statusCode: statusCode.OK,
        success: true,
        message: "Facebook leadgen forms fetched successfully",
        data
      };

    } catch (error) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: error.message
      };
    }
  },

  async getFormQuestions(formId, access_token) {
    try {
      if (!access_token) throw new Error('Access token is required');
      if (!formId) throw new Error('Form ID is required');

      const data = await getRequest(
        `${BASE_URL}/${formId}`,
        { fields: 'questions', access_token }
      );

      return {
        statusCode: statusCode.OK,
        success: true,
        message: "Facebook form questions fetched successfully",
        data
      };

    } catch (error) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: error.message
      };
    }
  },

  //intergation create

  /**
 * Create a Facebook Integration
 * @param {Object} params - { userId, page, form }
 */
  async createIntegration({ userId, page, form, pageAccessToken }) {
    try {
      if (!userId || !page?.id || !form?.id || !pageAccessToken) {
        return {
          statusCode: statusCode.BAD_REQUEST,
          success: false,
          message: 'userId, page, form, and pageAccessToken are required',
        };
      }
      const result = await sequelize.transaction(async (t) => {
        const existing = await FacebookIntegration.findOne({
          where: {
            user_id: userId,
            fb_page_id: page.id,
            fb_form_id: form.id,
          },
          transaction: t,
        });
        if (existing) {

          // 🔥 overwrite old/dead token
          await existing.update(
            {
              access_token: pageAccessToken,
              status: existing.status === 'inactive' ? 'inactive' : existing.status,
              token_invalid_at: null,
            },
            { transaction: t }
          );

          return {
            integration: existing,
            isNew: false,
            resumeFrom: existing.status === 'active' ? 'finished' : 'mapping',
            tokenUpdated: true,
          };
        }
        const integration = await FacebookIntegration.create(
          {
            user_id: userId,
            fb_page_id: page.id,
            fb_page_name: page.name,
            fb_form_id: form.id,
            fb_form_name: form.name,
            access_token: pageAccessToken, // PAGE TOKEN
            status: 'inactive', // 👈 mapping ke baad active hoga
          },
          { transaction: t }
        );
        return {
          integration,
          isNew: true,
          resumeFrom: 'mapping',
        };
      });
      return {
        statusCode: statusCode.OK,
        success: true,
        message: result.isNew ? 'Integration created successfully' : 'Integration already exists',
        data: result,
      };
    } catch (error) {
      console.error('Error in createIntegration:', error);
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: error.message,
      };
    }
  },

  /**
 * Bulk create field mappings for a Facebook integration
 * @param {number} integrationId
 * @param {Array} mappings
 */
  async saveIntegrationMappings(integrationId, mappings) {
    try {
      if (!integrationId || !Array.isArray(mappings) || mappings.length === 0) {
        return {
          statusCode: statusCode.BAD_REQUEST,
          success: false,
          message: 'integrationId and mappings are required',
        };
      }

      const created = await sequelize.transaction(async (t) => {

        await FbFieldMapping.destroy({
          where: { integration_id: Number(integrationId) },
          transaction: t,
        });

        const rows = mappings.map(m => ({
          integration_id: Number(integrationId), // 🔥 FIX
          fb_field_key: m.fb,
          crm_field_key: m.crm,
          replace_if_empty: m.replace ?? true,
        }));

        const result = await FbFieldMapping.bulkCreate(rows, {
          transaction: t,
          returning: ["id", "integration_id", "fb_field_key", "crm_field_key", "replace_if_empty"] // Only return existing columns
        });

        await FacebookIntegration.update(
          { status: 'inactive' },
          { where: { id: Number(integrationId) }, transaction: t }
        );

        return result;
      });

      return {
        statusCode: statusCode.OK,
        success: true,
        message: 'Integration mappings saved successfully',
        data: created,
      };

    } catch (error) {
      console.error('saveIntegrationMappings error:', error);
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: error.message,
      };
    }
  },


  async saveLeadDistributionRules(integrationId, users) {
    return sequelize.transaction(async (t) => {
      // remove old rules
      await FbLeadDistributionRule.destroy({
        where: { integration_id: integrationId },
        transaction: t,
      });

      await FbLeadDistributionState.destroy({
        where: { integration_id: integrationId },
        transaction: t,
      });

      // insert new rules
      const rules = users.map((u) => ({
        integration_id: integrationId,
        user_id: u.userId,
        percentage: u.percentage,
        is_active: true,
      }));

      await FbLeadDistributionRule.bulkCreate(rules, {
        transaction: t,
      });

      // init state
      const stateRows = users.map((u) => ({
        integration_id: integrationId,
        user_id: u.userId,
        assigned_count: 0,
      }));

      await FbLeadDistributionState.bulkCreate(stateRows, {
        transaction: t,
      });

      await FacebookIntegration.update(
        { status: 'active' },
        { where: { id: integrationId } }
      );
      return {
        success: true,
        message: 'Lead distribution rules saved successfully'
      }
    });
  },



  /* =========================
     OAUTH CALLBACK
  ========================== */

  async handleCallback(req) {
    const code = req.query.code;
    if (!code) throw new Error("No code received");

    // 🔹 Exchange code → access token
    const tokenRes = await getRequest(
      'https://graph.facebook.com/v17.0/oauth/access_token',
      {
        client_id: process.env.FB_APP_ID,
        client_secret: process.env.FB_APP_SECRET,
        redirect_uri: process.env.FB_REDIRECT_URI,
        code
      }
    );

    const { access_token, expires_in } = tokenRes;

    if (!access_token) {
      throw new Error("Failed to get access token");
    }

    // 🔹 Get FB user id
    const meRes = await getRequest(
      'https://graph.facebook.com/me',
      { access_token }
    );

    const token_expires_at = new Date(Date.now() + expires_in * 1000);

    await FacebookConnection.upsert({
      user_id: req.user.id,
      fb_user_id: meRes.id,
      access_token,
      token_expires_at
    });

    return true;
  },



  async handleWebhook(req, res) {
    try {
      console.log('Received Facebook webhook:', JSON.stringify(req.body));
      const entry = req.body.entry?.[0];
      const change = entry?.changes?.[0];

      console.log('Parsed webhook change:', JSON.stringify(change));

      if (!change || change.field !== 'leadgen') {
        return res.sendStatus(200);
      }

      const {
        leadgen_id,
        form_id,
        page_id
      } = change.value;

      console.log(`Processing leadgen webhook - LeadGenID: ${leadgen_id}, FormID: ${form_id}, PageID: ${page_id}`);
      // 1️⃣ find integration
      const integration = await FacebookIntegration.findOne({
        where: {
          fb_page_id: page_id,
          fb_form_id: form_id,
          status: 'active',
        },
      });

      if (!integration) {
        console.log('No active integration found');
        return res.sendStatus(200);
      }

      // 2️⃣ fetch lead from facebook
      const leadData = await fetchFacebookLead(
        leadgen_id,
        process.env.FB_ACCESS_TOKEN

      );
      console.log('Fetched lead data from Facebook:', JSON.stringify(leadData));

      // 3️⃣ apply mapping
      const mappedLead = await applyFieldMapping(
        integration.id,
        leadData
      );

   
      // 4️⃣ assign user (percentage logic)
      const assignedUserId = await assignLeadByPercentage(
        integration.id
      );

      console.log(`Assigned user ID ${assignedUserId} for lead ${leadgen_id}`);
      // 5️⃣ save lead
      await Lead.create({
        integration_id: integration.id,
        assignedTo: assignedUserId,
        name: mappedLead.name,
        whatsapp_number: mappedLead.phone,
        email: mappedLead.email,
        data: leadData,
        source:"facebook",
        createdBy:1,
      });

   
    } catch (err) {
      console.error('Webhook error:', err);
      return res.sendStatus(500);
    }
  },

};











async function handleFacebookLead(integration, mappedLead) {
  const assignedUserId = await assignLeadByPercentage(integration.id);

  await Lead.create({
    integration_id: integration.id,
    assigned_user_id: assignedUserId,
    name: mappedLead.name,
    phone: mappedLead.phone,
    email: mappedLead.email,
    raw_payload: mappedLead.raw,
  });
}
