const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { errors } = require("strapi-plugin-upload");

module.exports = {
  init(providerOptions) {
    const verifySize = (file) => {
      if (file.size > providerOptions.sizeLimit) {
        throw errors.entityTooLarge();
      }
    };
    const configPublicPath = strapi.config.get(
      "middleware.settings.public.path",
      strapi.config.paths.static
    );

    const uploadDir = path.resolve(strapi.dir, configPublicPath);
    const imgExt = [".jpg", ".jpeg", ".png", ".webp"];
    return {
      upload(file) {
        verifySize(file);
        return new Promise((resolve, reject) => {
          if (imgExt.includes(file.ext)) {
            sharp(file.buffer)
              .resize({ width: 1000 })
              .jpeg({
                quality: 80,
              })
              .toFile(
                path.join(uploadDir, `/uploads/${file.hash}.jpeg`),
                (err, info) => {
                  file.url = `/uploads/${file.hash}.jpeg`;
                  file.name = `${file.hash}.jpeg`;
                  file.ext = ".jpeg";
                  file.mime = "image/jpeg";
                  resolve();
                }
              );
          } else {
            fs.writeFile(
              path.join(uploadDir, `/uploads/${file.hash}${file.ext}`),
              file.buffer,
              (err) => {
                if (err) {
                  return reject(err);
                }
                file.url = `/uploads/${file.hash}${file.ext}`;
                resolve();
              }
            );
          }
        });
      },
      delete(file) {
        return new Promise((resolve, reject) => {
          const filePath = path.join(uploadDir, file.url);

          if (!fs.existsSync(filePath)) {
            return resolve("File doesn't exist");
          }
          fs.unlink(filePath, (err) => {
            if (err) {
              return reject(err);
            }
            resolve();
          });
        });
      },
    };
  },
};
