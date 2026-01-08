// CrmField Model
module.exports = (sequelize, DataTypes) => {
  const CrmField = sequelize.define('CrmField', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    field_key: { type: DataTypes.TEXT, unique: true },
    label: { type: DataTypes.TEXT }
  }, {
    tableName: 'crm_fields',
    timestamps: false
  });
  return CrmField;
};
