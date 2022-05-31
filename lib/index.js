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
          let fileName = file.name.replace(/\.[^/.]+$/, "");

          if (imgExt.includes(file.ext)) {
            sharp(file.buffer)
              .resize({ width: 1000 })
              .webp({ quality: 20 })
              .toFile(
                path.join(uploadDir, `/uploads/${fileName}.webp`),
                (err, info) => {
                  file.webp = `/uploads/${fileName}.webp`;
                }
              );

            sharp(file.buffer)
              .resize({ width: 1000 })
              .jpeg({
                mozjpeg: true,
                quality: 85,
              })
              .toFile(
                path.join(uploadDir, `/uploads/${fileName}.jpeg`),
                (err, info) => {
                  file.url = `/uploads/${fileName}.jpeg`;
                  file.name = `${fileName}.jpeg`;
                  resolve();
                }
              );
          } else {
            fs.writeFile(
              path.join(uploadDir, `/uploads/${fileName}${file.ext}`),
              file.buffer,
              (err) => {
                if (err) {
                  return reject(err);
                }
                file.url = `/uploads/${fileName}${file.ext}`;
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
