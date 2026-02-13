const {ActivityHistory}=require('../pgModels/index');

async function logActivity({leadId,type,title,description,metaData = {},userId=null}) 
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


/**
 * Activity Formatter (Strategy Pattern)
 * Makes activity response UI ready
 */

const formatActivity = (activity, statusMap = {}) => {

  const base = {
    id: activity.id,
    type: activity.activity_type,
    title: activity.title,
    description: activity.description,
    created_at: activity.created_at,
    created_by: activity.user?.name || activity.created_by,
  };

  const formatters = {

    STATUS: () => ({
      ...base,
      from_status: statusMap[activity.meta_data?.from_status_id] || null,
      to_status: statusMap[activity.meta_data?.to_status_id] || null
    }),

    WHATSAPP: () => ({
      ...base,
      message_type: activity.meta_data?.message_type || null,
      media_type: activity.meta_data?.media_type || null,
      media_url: activity.meta_data?.media_url || null,
      sent_via: activity.meta_data?.sent_via || "API"
    }),

    FIELD: () => ({
      ...base,
      field: activity.meta_data?.field || null,
      old_value: activity.meta_data?.oldValue || null,
      new_value: activity.meta_data?.newValue || null
    }),

  };

  return formatters[activity.activity_type]
    ? formatters[activity.activity_type]()
    : { ...base, meta_data: activity.meta_data || {} };
};



module.exports = {
  logActivity,formatActivity
}