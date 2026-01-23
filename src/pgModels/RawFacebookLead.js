// RawFacebookLead Model
module.exports = (sequelize, DataTypes) => {
  const RawFacebookLead = sequelize.define('RawFacebookLead', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fb_lead_id: { type: DataTypes.TEXT, unique: true },
    payload: { type: DataTypes.JSONB },
    processed: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'raw_facebook_leads',
    timestamps: false
  });
  return RawFacebookLead;
};
