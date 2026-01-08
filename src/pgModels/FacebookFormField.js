// FacebookFormField Model
module.exports = (sequelize, DataTypes) => {
  const FacebookFormField = sequelize.define('FacebookFormField', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    form_id: { type: DataTypes.INTEGER, references: { model: 'facebook_forms', key: 'id' } },
    fb_field_key: { type: DataTypes.TEXT },
    fb_field_label: { type: DataTypes.TEXT }
  }, {
    tableName: 'facebook_form_fields',
    timestamps: false
  });
  FacebookFormField.associate = models => {
    FacebookFormField.belongsTo(models.FacebookForm, { foreignKey: 'form_id' });
  };
  return FacebookFormField;
};
