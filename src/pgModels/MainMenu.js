module.exports = (sequelize, DataTypes) => {
  const MainMenu = sequelize.define("Menu", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: DataTypes.STRING, // user, calling, dashboard
    key: DataTypes.STRING,  // user, calling
    path: DataTypes.STRING,
    icon: DataTypes.STRING, 
    order: DataTypes.INTEGER,
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    isHeaderMenu: { type: DataTypes.BOOLEAN, defaultValue: false },
    
  }, {
    tableName: "main_menu",
    timestamps: true
  });
  return MainMenu;
};
