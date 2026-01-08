// FacebookForm Model
module.exports = (sequelize, DataTypes) => {
  const FacebookForm = sequelize.define('FacebookForm', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    page_id: { type: DataTypes.INTEGER, references: { model: 'facebook_pages', key: 'id' } },
    fb_form_id: { type: DataTypes.TEXT, unique: true },
    name: { type: DataTypes.TEXT },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'facebook_forms',
    timestamps: false
  });
  FacebookForm.associate = models => {
    FacebookForm.belongsTo(models.FacebookPage, { foreignKey: 'page_id' });
    FacebookForm.hasMany(models.FacebookFormField, { foreignKey: 'form_id' });
    FacebookForm.hasMany(models.FbFieldMapping, { foreignKey: 'form_id' });
  };
  return FacebookForm;
};
