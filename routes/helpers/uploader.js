const multer = require("multer");
const multer_cloud_storage = require("multer-google-storage");


const uploader = multer({
    storage: multer_cloud_storage.storageEngine({
        filename: function (req, file, cb){
            let s = file.originalname.lastIndexOf('.')
            let dest = `Blog/${file.originalname.slice(0, s)}/default/${file.originalname}`
            cb(null, dest)
        }
    })
})

module.exports = {uploader}