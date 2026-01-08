// FbFieldMapping Model
module.exports = (sequelize, DataTypes) => {
  const FbFieldMapping = sequelize.define('FbFieldMapping', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    integration_id: { type: DataTypes.INTEGER, references: { model: 'facebook_integrations', key: 'id' } },
    form_id: { type: DataTypes.INTEGER, references: { model: 'facebook_forms', key: 'id' } },
    fb_field_key: { type: DataTypes.TEXT },
    crm_field_key: { type: DataTypes.TEXT },
    replace_if_empty: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'fb_field_mappings',
    timestamps: false
  });
  FbFieldMapping.associate = models => {
    
    FbFieldMapping.belongsTo(models.FacebookForm, { foreignKey: 'form_id' });
    FbFieldMapping.belongsTo(models.CrmField, { foreignKey: 'crm_field_key', targetKey: 'field_key' });
  };
  return FbFieldMapping;
};
