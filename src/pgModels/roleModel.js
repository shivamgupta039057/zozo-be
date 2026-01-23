module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define("Role", {
    roleName: { type: DataTypes.STRING, unique: true }
  });
  return Role;
};