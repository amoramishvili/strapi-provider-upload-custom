const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { errors } = require("strapi-plugin-upload");
const slugify = require("slugify");

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
          let fileName = slugify(file.name.replace(/\.[^/.]+$/, ""), {
            lower: true,
            strict: true,
          });

          if (imgExt.includes(file.ext)) {
            sharp(file.buffer)
              .resize({
                width: 1000,
              })
              .webp({
                alphaQuality: 80,
              })
              .toFile(
                path.join(uploadDir, `/uploads/${fileName}.webp`),
                (err, info) => {
                  file.webp = `/uploads/${fileName}.webp`;
                }
              );

            sharp(file.buffer)
              .resize({
                width: 1000,
              })
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
            let NewFile = path.join(
              uploadDir,
              `/uploads/${fileName}${file.ext}`
            );
            if (fs.existsSync(NewFile)) {
              fs.unlink(NewFile, (err) => {});
            }
            fs.writeFile(NewFile, file.buffer, (err) => {
              if (err) {
                return reject(err);
              }
              file.url = `/uploads/${fileName}${file.ext}`;
              resolve();
            });
          }
        });
      },
      delete(file) {
        return new Promise((resolve, reject) => {
          let fileExt = file.url.split(".").pop();
          const filePath = path.join(uploadDir, file.url);

          let newName = file.url.replace(/\.[^/.]+$/, "");
          let webpFilePath = path.join(uploadDir, `${newName}.webp`);

          if (imgExt.includes(`.${fileExt}`) && fs.existsSync(webpFilePath)) {
            fs.unlink(webpFilePath, (err) => {});
          }

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
