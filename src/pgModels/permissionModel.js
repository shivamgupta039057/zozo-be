module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define("Permission", {
    name: { type: DataTypes.STRING, unique: true }
  });
  return Permission;
};
