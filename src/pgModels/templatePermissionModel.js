module.exports = (sequelize, DataTypes) => {
  const TemplatePermission = sequelize.define("TemplatePermission", {
    canCreate: { type: DataTypes.BOOLEAN, defaultValue: false },
    canView: { type: DataTypes.BOOLEAN, defaultValue: false },
    canEdit: { type: DataTypes.BOOLEAN, defaultValue: false },
    canDelete: { type: DataTypes.BOOLEAN, defaultValue: false },
  });



  return TemplatePermission;
};
