// Campaign Model
module.exports = (sequelize, DataTypes) => {
  const Campaign = sequelize.define('Campaign', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.TEXT },
    user_id: { type: DataTypes.INTEGER }
  }, {
    tableName: 'campaigns',
    timestamps: false
  });
  Campaign.associate = models => {
    Campaign.hasMany(models.Lead, { foreignKey: 'campaign_id' });
  };
  return Campaign;
};
