const fs = require("fs");
const path = require("path");

// exports.uploadFile = (req, res, next) => {
//   try {
 
//     if (req.files) {
//       for (let file of req.files) {
//         // req.body[file.fieldname] ? req.body[file.fieldname].push(file.filename) : req.body[file.fieldname] = [file.filename]
//         req.body[file.fieldname]
//           ? req.body[file.fieldname].push(
//               `${req.body.folderName}/${file.filename}`
//             )
//           : (req.body[file.fieldname] = [
//               `${req.body.folderName}/${file.filename}`,
//             ]);
//         // const extension = file.mimetype.split("/")[1] || file.mimetype.split("/")[0];
//         // req.body.extension = req.body.extension ? [...req.body.extension, extension] : [extension];
//         let extension = file.mimetype.split("/");
//         let newone = extension.includes("pdf") ? extension[1] : extension[0];
//         req.body.extension
//           ? req.body.extension.push(newone)
//           : (req.body.extension = [newone]);
//       }
//     } else if (req.file) {
//       // req.body[req.file.fieldname] = req.file.filename;
//       // req.body[req.file.fieldname] = `${req.body.folderName}/${req.file.filename}`;
//       req.body[
//         req.file.fieldname
//       ] = `${req.body.folderName}/${req.file.filename}`;
//       req.body.originalname = req.file.originalname;
//       req.body.path= req.file.path;
//       const type = req.file.mimetype.split("/")[0];
//       req.body.extension = type;
//     }
//     delete req.body.folderName;
//     next();
//   } catch (error) {
//     console.log(error);
//   }
// };
exports.uploadFile = (req, res, next) => {
  try {
    // If multiple files
    if (req.files) {
      req.files.forEach((file) => {
        const fileData = file.location; // S3 returns the full URL here
        
        if (req.body[file.fieldname]) {
          req.body[file.fieldname].push(fileData);
        } else {
          req.body[file.fieldname] = [fileData];
        }
      });
    } 
    // If single file
    else if (req.file) {
      // file.location is the permanent URL of the image on the internet
      req.body[req.file.fieldname] = req.file.location;
      req.body.originalname = req.file.originalname;
      req.body.extension = req.file.mimetype.split("/")[0];
    }

    next();
  } catch (error) {
    console.log("S3 Middleware Error:", error);
    res.status(500).json({ error: "File upload failed" });
  }
};
exports.deleteFile = ({ imageName, folderName }) => {
  if (imageName)
    fs.unlinkSync(
      path.join(__dirname, "../../public/uploads/", folderName, imageName)
    );
};
