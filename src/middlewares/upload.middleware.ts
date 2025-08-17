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
const modelsDir = path.join(uploadsRoot, 'models');
const iconsDir = path.join(uploadsRoot, 'icons');

ensureDir(profilePicturesDir);
ensureDir(modelsDir);
ensureDir(iconsDir);

// Storage for profile pictures
const profilePictureStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, profilePicturesDir);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname) || '.png';
        cb(null, `${unique}${ext}`);
    },
});

// Storage for POI files (icons and 3D models)
const poiFileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'iconFile') {
            cb(null, iconsDir);
        } else if (file.fieldname === 'modelFile') {
            cb(null, modelsDir);
        } else {
            cb(new Error('Invalid field name for file upload'), '');
        }
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname) || '';
        cb(null, `${unique}${ext}`);
    },
});

const profilePictureFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Invalid file type. Only PNG, JPG, JPEG, WEBP allowed.'));
};

const poiFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    if (file.fieldname === 'iconFile') {
        // Icons: image files
        const allowedIcons = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (allowedIcons.includes(file.mimetype)) return cb(null, true);
        cb(new Error('Invalid icon file type. Only PNG, JPG, JPEG, WEBP allowed.'));
    } else if (file.fieldname === 'modelFile') {
        // 3D Models: OBJ, GLB, FBX files
        const allowedModels = ['application/octet-stream', 'text/plain']; // OBJ files often have these MIME types
        const extension = path.extname(file.originalname).toLowerCase();
        const allowedExtensions = ['.obj', '.glb', '.fbx'];
        
        if (allowedModels.includes(file.mimetype) || allowedExtensions.includes(extension)) {
            return cb(null, true);
        }
        cb(new Error('Invalid model file type. Only OBJ, GLB, FBX files allowed.'));
    } else {
        cb(new Error('Unknown file field'));
    }
};

export const uploadProfilePicture = multer({
    storage: profilePictureStorage,
    fileFilter: profilePictureFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('profilePicture');

export const uploadPOIFiles = multer({
    storage: poiFileStorage,
    fileFilter: poiFileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for 3D models
}).fields([
    { name: 'iconFile', maxCount: 1 },
    { name: 'modelFile', maxCount: 1 }
]);
