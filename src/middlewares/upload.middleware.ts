import multer from 'multer';
import path from 'path';
import fs from 'fs';

const ensureDir = (dir: string) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
const profilePicturesDir = path.join(uploadsRoot, 'profile-pictures');
ensureDir(profilePicturesDir);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, profilePicturesDir);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname) || '.png';
        cb(null, `${unique}${ext}`);
    },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Invalid file type. Only PNG, JPG, JPEG, WEBP allowed.'));
};

export const uploadProfilePicture = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('profilePicture');
