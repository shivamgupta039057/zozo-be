// FacebookPage Model
module.exports = (sequelize, DataTypes) => {
  const FacebookPage = sequelize.define('FacebookPage', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    connection_id: { type: DataTypes.INTEGER, references: { model: 'facebook_connections', key: 'id' } },
    fb_page_id: { type: DataTypes.TEXT, unique: true },
    name: { type: DataTypes.TEXT },
    page_access_token: { type: DataTypes.TEXT },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'facebook_pages',
    timestamps: false
  });
  FacebookPage.associate = models => {
    FacebookPage.belongsTo(models.FacebookConnection, { foreignKey: 'connection_id' });
    FacebookPage.hasMany(models.FacebookForm, { foreignKey: 'page_id' });
  };
  return FacebookPage;
};
