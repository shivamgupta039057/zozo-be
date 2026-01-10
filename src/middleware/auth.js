const jwt = require('jsonwebtoken');
const config = require('../config/dev.config');
const {UserModel} = require('../pgModels/index');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Token Not Found',
                data: []
            });
        }

        const token = authHeader.split(' ').pop();
      
        let payload;
        try {
            payload = jwt.verify(token, config.SECRET);
           
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Token',
                data: []
            });
        }

        const user = await UserModel.findOne({ where: { id: payload.id, isDeleted: false } });
       
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
                data: []
            });
        }

        if (user.isBlocked) {
            return res.status(401).json({
                success: false,
                message: 'Your Account is Blocked...!'
            });
        }

        // You can whitelist specific profile routes where incomplete registration is allowed
        // const openRoutes = ["/set-self-profile", "/profile", "/SignStampUpload"];
        // // V2: If user is registered and doc is added, or it's an open route, allow
        // if (
        //     (user.isRegister && user.isDocAdd) ||
        //     openRoutes.some(route => req.url.startsWith(route))
        // ) {
            req.user = user;
            return next();
        // } else {
        //     return res.status(401).json({
        //         success: false,
        //         message: 'Unauthorized',
        //         data: []
        //     });
        // }

    } catch (error) {
        console.log(error);
        return res.status(401).json({
            success: false,
            message: 'Invalid Token',
            data: []
        });
    }
};