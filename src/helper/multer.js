// const multer = require('multer')
// const path = require('path')
// const fs = require('fs')


// const uploadPath = path.join(__dirname, "../../public/uploads")
// if (!fs.existsSync(uploadPath)) {
//     fs.mkdirSync(uploadPath)
// }

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         console.log( req.body.folderName , "bbbbbb")
//         if (!req.body.folderName) return cb(new Error("Multer: folderName field not found in request body"))
//         const typePath = path.join(uploadPath, req.body.folderName)
//         if (!fs.existsSync(typePath)) {
//             fs.mkdirSync(typePath)
//         }
//         cb(null, typePath)
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//         cb(null, file.fieldname + '-' + uniqueSuffix + file.originalname)
//     }
// })

// module.exports = multer({ storage: storage })

const path = require("path");
const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const devConfig = require("../config/dev.config");

// 1. Setup S3 Client
const s3 = new S3Client({
    region: devConfig.S3_REGION,
    credentials: {
        accessKeyId: devConfig.S3_ACCESS_KEY,
        secretAccessKey: devConfig.S3_SECRET_KEY,
    },
});

// 2. Setup Multer to use S3 Storage
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: devConfig.S3_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            // This replaces your folder logic. 
            // It creates a 'folder' structure inside the S3 bucket
            const folder = req.body.folderName || 'general';
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `${folder}/${uniqueSuffix}-${file.originalname}`);
        }
    }),
    fileFilter: function (req, file, cb) {
        const allowed = [".xlsx", ".xls", ".csv"];
        const ext = path
            .extname(file.originalname)
            .toLowerCase();

        if (!allowed.includes(ext)) {
            return cb(
                new Error("Only Excel and CSV files are allowed")
            );
        }

        cb(null, true);
    },

    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

module.exports = upload;