const {PermissionTemplateModel,UserModel,MainMenuModel,TemplatePermissionModel } = require("../pgModels/index");

module.exports = (menuId, action) => {
  return async (req, res, next) => {
    const userId = req.user.id; 

    const user = await UserModel.findByPk(userId, {
      include: {
        model: PermissionTemplateModel,
        include: {
          model: TemplatePermissionModel,
          include: MainMenuModel,
        },
      },
    });

    let allowed = false;

    user.PermissionTemplates.forEach((template) => {
      template.TemplatePermissions.forEach((perm) => {
        if (perm.MainMenuModel.id === menuId && perm[`can${action}`]) {
          allowed = true;
        }
      });
    });

    if (!allowed) {
      return res.status(403).json({ message: "Permission Denied" });
    }

    next();
  };
};
