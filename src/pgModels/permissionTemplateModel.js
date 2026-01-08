module.exports = (sequelize, DataTypes) => {
  const PermissionTemplate = sequelize.define("PermissionTemplate", {
    templateName: {
      type: DataTypes.STRING,
      unique: true
    },
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    // tableName: 'permission_templates',
    timestamps: true
  });
  return PermissionTemplate;
};
