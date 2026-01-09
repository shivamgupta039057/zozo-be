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
      // references: will be set up in associations
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
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
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