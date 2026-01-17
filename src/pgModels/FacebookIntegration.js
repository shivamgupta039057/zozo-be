
module.exports = (sequelize, DataTypes) => {
  const FacebookIntegration = sequelize.define('FacebookIntegration', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: 'CASCADE',
    },
    fb_page_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fb_page_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fb_form_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fb_form_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    access_token: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('inactive', 'active'),
      defaultValue: 'inactive',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'facebook_integrations',
    timestamps: false,
  });
  return FacebookIntegration;
};
