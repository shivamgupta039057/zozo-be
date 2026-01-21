const fs = require("fs");
const path = require("path");

exports.uploadFile = (req, res, next) => {
  try {
 
    if (req.files) {
      for (let file of req.files) {
        // req.body[file.fieldname] ? req.body[file.fieldname].push(file.filename) : req.body[file.fieldname] = [file.filename]
        req.body[file.fieldname]
          ? req.body[file.fieldname].push(
              `${req.body.folderName}/${file.filename}`
            )
          : (req.body[file.fieldname] = [
              `${req.body.folderName}/${file.filename}`,
            ]);
        // const extension = file.mimetype.split("/")[1] || file.mimetype.split("/")[0];
        // req.body.extension = req.body.extension ? [...req.body.extension, extension] : [extension];
        let extension = file.mimetype.split("/");
        let newone = extension.includes("pdf") ? extension[1] : extension[0];
        req.body.extension
          ? req.body.extension.push(newone)
          : (req.body.extension = [newone]);
      }
    } else if (req.file) {
   
      // req.body[req.file.fieldname] = req.file.filename;
      // req.body[req.file.fieldname] = `${req.body.folderName}/${req.file.filename}`;
      req.body[
        req.file.fieldname
      ] = `${req.body.folderName}/${req.file.filename}`;
      req.body.originalname = req.file.originalname;
      req.body.path= req.file.path;
      console.log(req.body, "mmmmmmmmm");
      const type = req.file.mimetype.split("/")[0];
      req.body.extension = type;
    }
    delete req.body.folderName;
    next();
  } catch (error) {
    console.log(error);
  }
};
exports.deleteFile = ({ imageName, folderName }) => {
  if (imageName)
    fs.unlinkSync(
      path.join(__dirname, "../../public/uploads/", folderName, imageName)
    );
};
