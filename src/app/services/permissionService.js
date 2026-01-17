
const { statusCode, resMessage } = require("../../config/default.json");
const { PermissionTemplateModel,UserModel,MainMenuModel,TemplatePermissionModel } = require("../../pgModels/index");


exports.getPermssionTemplates = async () => {
  try {
    const templates = await PermissionTemplateModel.findAll({
      include: [
        { model: UserModel, as: 'users', attributes: ['id'] }
      ]
    });

    // For each template, fetch its permissions with menu info
    const result = [];
    for (const t of templates) {
      // Get all permissions for this template, joined with menu
      const perms = await TemplatePermissionModel.findAll({
        where: { PermissionTemplateId: t.id },
        include: [
          { model: MainMenuModel }
        ]
      });
     
      const permissions = perms.map(p => ({
        menuId: p.MenuId,
        menuName: p.Menu ? p.Menu.name : undefined,
        menuPath: p.Menu ? p.Menu.path : undefined,
        menuOrder: p.Menu ? p.Menu.order : undefined,
        isHeaderMenu: p.Menu ? p.Menu.isHeaderMenu : undefined,
        create: p.canCreate,
        view: p.canView,
        edit: p.canEdit,
        delete: p.canDelete
      }));
      result.push({
        id: t.id,
        name: t.name || t.templateName,
        permissions,
        assignTo: t.users ? t.users.length : 0,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      });
    }

    return {
      statusCode: statusCode.OK,
      success: true,
      message: "Permission Template",
      data: result,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.getTemplatesName = async () => {
  try {
    const templates = await PermissionTemplateModel.findAll({
      attributes: ['name', 'id']
    });

    const templateNames = templates.map(t => ({
      id: t.id,
      templateName: t.name
    }));

    return {
      statusCode: statusCode.OK,
      success: true,
      message: "Template Names",
      data: templateNames,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.createPermissionTemplate = async (body) => {
  try {
    const { name,permissions } = body;

  const template = await PermissionTemplateModel.create({ name });

  for (const perm of permissions) {
    const menu = await MainMenuModel.findOne({ where: { id:perm.menuId } });

    if (!menu) continue;

    await TemplatePermissionModel.create({
      PermissionTemplateId: template.id,
      MenuId: menu.id,
      canCreate: perm.create || false,
      canView: perm.view || false,
      canEdit: perm.edit || false,
      canDelete: perm.delete || false,
    });
  }

    return {
      statusCode: statusCode.OK,
      success: true,
      message: 'Template created with default permissions',
      data: template,
    };


  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.updatePermissionTemplate = async (param, body) => {
  try {
    const { id } = param;

    const template = await PermissionTemplateModel.findByPk(id);
    if (!template) throw new Error('Template not found');
    template.permissions = body.permissions || template.permissions;
    await template.save();

    return {
      statusCode: statusCode.OK,
      success: true,
      message: 'Template Permission Edited',
      data: template,
    };


  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.getMenuList = async () => {
  try {
    const menus = await MainMenuModel.findAll();
    return {
      statusCode: statusCode.OK,
      success: true,
      message: "Menu List",
      data: menus,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


// Get permissions for a user by their id (from auth)
exports.getUserPermissions = async (userId) => {
  try {
    // Find user and their permission template
    const user = await UserModel.findByPk(userId);
    if (!user || !user.permissionTemplateId) {
      return {
        statusCode: statusCode.NOT_FOUND,
        success: false,
        message: "User or permission template not found",
      };
    }
    // Get all permissions for this user's template, joined with menu
    const perms = await TemplatePermissionModel.findAll({
      where: { PermissionTemplateId: user.permissionTemplateId },
      include: [
        { model: MainMenuModel }
      ]
    });
    const permissions = perms.map(p => ({
      menuId: p.MenuId,
      menuName: p.Menu ? p.Menu.name : undefined,
      menuPath: p.Menu ? p.Menu.path : undefined,
      menuOrder: p.Menu ? p.Menu.order : undefined,
      isHeaderMenu: p.Menu ? p.Menu.isHeaderMenu : undefined,
      create: p.canCreate,
      view: p.canView,
      edit: p.canEdit,
      delete: p.canDelete
    }));
    return {
      statusCode: statusCode.OK,
      success: true,
      message: "User permissions fetched",
      data: permissions,
    };
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

