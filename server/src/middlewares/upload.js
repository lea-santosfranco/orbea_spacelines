import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { HttpError } from '../utils/httpError.js';

const PRODUCTS_DIR = path.resolve('uploads', 'products');
fs.mkdirSync(PRODUCTS_DIR, { recursive: true });

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Le nom du fichier est généré par le serveur : jamais celui envoyé par l'utilisateur (risque de chemins piégés)
const storage = multer.diskStorage({
  destination: PRODUCTS_DIR,
  filename: (req, file, callback) => {
    callback(null, `${crypto.randomUUID()}.${EXTENSIONS[file.mimetype]}`);
  },
});

const multerUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }, // 2 Mo maximum, une image à la fois
  fileFilter: (req, file, callback) => {
    if (EXTENSIONS[file.mimetype]) callback(null, true);
    else callback(new HttpError(400, 'Format accepté : JPEG, PNG ou WebP'));
  },
}).single('image');

// Le type annoncé par le navigateur peut mentir : on vérifie la « signature » réelle du fichier (ses premiers octets)
function hasImageSignature(buffer) {
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const isWebp =
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return isJpeg || isPng || isWebp;
}

export function uploadProductImage(req, res, next) {
  multerUpload(req, res, async (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return next(new HttpError(400, "L'image ne doit pas dépasser 2 Mo"));
      }
      return next(error instanceof HttpError ? error : new HttpError(400, "L'envoi de l'image a échoué"));
    }
    if (!req.file) return next(new HttpError(400, 'Aucune image reçue'));

    const handle = await fs.promises.open(req.file.path, 'r');
    const { buffer } = await handle.read(Buffer.alloc(12), 0, 12, 0);
    await handle.close();

    if (!hasImageSignature(buffer)) {
      await fs.promises.rm(req.file.path, { force: true });
      return next(new HttpError(400, "Ce fichier n'est pas une image valide"));
    }
    next();
  });
}
