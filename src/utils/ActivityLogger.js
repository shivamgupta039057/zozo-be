const {ActivityHistory}=require('../pgModels/index');

async function logActivity({leadId,type,title,description,metaData = {},userId = "SYSTEM"}) 
{
  await ActivityHistory.create({
    lead_id: leadId,
    activity_type: type,
    title,
    description,
    meta_data: metaData,
    created_by: userId
  });
}

module.exports = {
  logActivity
}