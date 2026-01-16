module.exports = (sequelize, DataTypes) => {
  const PermissionTemplate = sequelize.define("PermissionTemplate", {
    name: DataTypes.STRING,
    description: DataTypes.STRING,
  }, {
    timestamps: true
  });


  return PermissionTemplate;
};
