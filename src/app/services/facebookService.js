const FacebookIntegration = require('../../pgModels/FacebookIntegration');
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

const {
  FacebookConnection,
  FacebookPage,
  FacebookForm,
  FacebookFormField,
  CrmField,
  FbFieldMapping,
  Campaign,
  RawFacebookLead
} = require('../../pgModels/index');

const BASE_URL = 'https://graph.facebook.com/v24.0';
const { statusCode } = require("../../config/default.json");

module.exports = {
  /**
   * Bulk create field mappings for a Facebook integration
   * @param {number} integrationId
   * @param {Array} mappings
   */
  async saveIntegrationMappings(integrationId, mappings) {
    if (!integrationId || !Array.isArray(mappings)) {
      throw new Error('integrationId and mappings are required');
    }
    const { FbFieldMapping } = require('../../pgModels/index');
    if (!FbFieldMapping) {
      throw new Error('FbFieldMapping model not found');
    }
    return await FbFieldMapping.bulkCreate(
      mappings.map(m => ({
        integration_id: integrationId,
        fb_field_key: m.fb,
        crm_field_key: m.crm,
        replace_if_empty: m.replace
      }))
    );
  },



  /* =========================
     FACEBOOK READ APIs
  ========================== */

  async getUserPages(access_token) {
    try {
      if (!access_token) throw new Error('Access token is required');

      const data = await getRequest(
        `${BASE_URL}/me/accounts`,
        { access_token }
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
  async createIntegration({ userId, page, form }) {
    if (!userId || !page?.id || !form?.id) {
      throw new Error('userId, page.id, and form.id are required');
    }
    const integration = await FacebookIntegration.create({
      user_id: userId,
      fb_page_id: page.id,
      fb_page_name: page.name,
      fb_form_id: form.id,
      fb_form_name: form.name,
      status: 'active',
    });
    return integration;
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

  /* =========================
     WEBHOOK HANDLER (REAL LOGIC)
  ========================== */

  async handleWebhookEvent(body) {
    const value = body.entry?.[0]?.changes?.[0]?.value;

    if (!value?.leadgen_id || !value?.page_id) return;

    /* 1️⃣ Resolve Facebook Page */
    const page = await FacebookPage.findOne({
      where: { fb_page_id: value.page_id }
    });

    if (!page) return;

    /* 2️⃣ Fetch full lead from Facebook */
    const leadData = await getRequest(
      `${BASE_URL}/${value.leadgen_id}`,
      { access_token: page.page_access_token }
    );

    /* 3️⃣ Save raw Facebook lead (IMPORTANT) */
    const rawLead = await RawFacebookLead.create({
      fb_lead_id: value.leadgen_id,
      fb_form_id: leadData.form_id,
      fb_page_id: value.page_id,
      payload: leadData
    });

    /* 4️⃣ Get mappings */
    const mappings = await FbFieldMapping.findAll({
      where: { form_id: leadData.form_id }
    });

    if (!mappings.length) return;

    /* 5️⃣ Build CRM payload */
    const crmPayload = {};

    for (const map of mappings) {
      const fbField = leadData.field_data.find(
        f => f.name === map.fb_field_key
      );

      if (fbField) {
        crmPayload[map.crm_field_key] = fbField.values[0];
      }
    }

    /* 6️⃣ Attach campaign if exists */
    const campaign = await Campaign.findOne({
      where: { source: 'facebook', source_ref_id: leadData.form_id }
    });

    if (campaign) {
      crmPayload.campaign_id = campaign.id;
    }

    /* 7️⃣ Final CRM Lead Create */
    await CrmField.create({
      ...crmPayload,
      raw_facebook_lead_id: rawLead.id
    });

    return true;
  },


  async savePage(req) {
  const { fb_page_id, name, page_access_token } = req.body;

  if (!fb_page_id || !page_access_token) {
    throw new Error("fb_page_id and page_access_token are required");
  }

  // 1️⃣ Find facebook connection of logged-in user
  const connection = await FacebookConnection.findOne({
    where: { user_id: req.user.id }
  });

  if (!connection) {
    throw new Error("Facebook not connected for this user");
  }

  // 2️⃣ Save / update page
  const page = await FacebookPage.upsert({
    connection_id: connection.id,
    fb_page_id,
    name,
    page_access_token
  }, {
    returning: true
  });

  return page[0]; // sequelize upsert returns [row, created]
},


async saveForm(req) {
  const { page_id, fb_form_id, name, questions } = req.body;

  if (!page_id || !fb_form_id) {
    throw new Error("page_id and fb_form_id are required");
  }

  // 1️⃣ Save / update form
  const [form] = await FacebookForm.upsert({
    page_id,
    fb_form_id,
    name
  }, {
    returning: true
  });

  // 2️⃣ Remove old questions (re-select case)
  await FacebookFormField.destroy({
    where: { form_id: form.id }
  });

  // 3️⃣ Save questions
  if (Array.isArray(questions)) {
    for (const q of questions) {
      await FacebookFormField.create({
        form_id: form.id,
        fb_field_key: q.key,
        fb_field_label: q.label
      });
    }
  }

  return form;
},


async saveFieldMapping(req) {
  const { form_id, mappings } = req.body;

  if (!form_id || !Array.isArray(mappings)) {
    throw new Error("form_id and mappings are required");
  }

  // 1️⃣ Remove old mappings (re-map case)
  await FbFieldMapping.destroy({
    where: { form_id }
  });

  // 2️⃣ Save new mappings
  for (const map of mappings) {
    await FbFieldMapping.create({
      form_id,
      fb_field_key: map.fb_field,
      crm_field_key: map.crm_field
    });
  }

  return true;
}



};



