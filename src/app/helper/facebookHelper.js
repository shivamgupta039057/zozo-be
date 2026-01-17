const axios = require('axios');
const { FbFieldMapping, FbLeadDistributionRule, FbLeadDistributionState} = require('../../pgModels/index');

async function fetchFacebookLead(leadgenId, pageToken) {
  const url = `https://graph.facebook.com/v18.0/${leadgenId}`;

  const { data } = await axios.get(url, {
    params: {
      fields: 'created_time,field_data',
      access_token: pageToken,
    },
  });

  return data;
}


async function assignLeadByPercentage(integrationId) {
  const rules = await FbLeadDistributionRule.findAll({
    where: { integration_id: integrationId, is_active: true },
  });

  if (!rules.length) return null;

  const states = await FbLeadDistributionState.findAll({
    where: { integration_id: integrationId },
  });

  const stateMap = {};
  states.forEach((s) => {
    stateMap[s.user_id] = s.assigned_count;
  });

  const totalAssigned = Object.values(stateMap).reduce(
    (a, b) => a + b,
    0
  );

  let selectedUser = null;
  let bestGap = -Infinity;

  for (const rule of rules) {
    const actual = stateMap[rule.user_id] || 0;
    const expected = ((totalAssigned + 1) * rule.percentage) / 100;
    const gap = expected - actual;

    if (gap > bestGap) {
      bestGap = gap;
      selectedUser = rule.user_id;
    }
  }

  await FbLeadDistributionState.upsert({
    integration_id: integrationId,
    user_id: selectedUser,
    assigned_count: (stateMap[selectedUser] || 0) + 1,
  });

  return selectedUser;
}

async function applyFieldMapping(integrationId, leadData) {
  const mappings = await FbFieldMapping.findAll({
    where: { integration_id: integrationId },
  });

  const mapped = {};

  for (const m of mappings) {
    const fbField = leadData.field_data.find(
      f => f.name === m.fb_field_key
    );

    if (!fbField) continue;

    const value = fbField.values?.[0];
    if (!value) continue;

    if (!mapped[m.crm_field_key] || m.replace_if_empty) {
      mapped[m.crm_field_key] = value;
    }
  }

  return mapped;
}
module.exports = {
  fetchFacebookLead,
  applyFieldMapping,assignLeadByPercentage
};