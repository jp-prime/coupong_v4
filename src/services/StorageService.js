import imageCompression from 'browser-image-compression';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const StorageService = {
    // 압축 프리셋 정의
    COMPRESSION_PRESETS: {
        high: {
            maxSizeMB: 1.5,
            maxWidthOrHeight: 3840,
            initialQuality: 0.99
        },
        standard: {
            maxSizeMB: 0.8,
            maxWidthOrHeight: 2560,
            initialQuality: 0.99
        },
        low: {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1600,
            initialQuality: 0.95
        }
    },

    sanitizeFileName: (name) => {
        if (!name) return 'image';
        return name
            .toString()
            .toLowerCase()
            .replace(/[^a-z0-9\u3131-\uD79D\s-]/g, '') // Keep alphanumeric, Korean, and spaces/hyphens
            .trim()
            .replace(/\s+/g, '-')
            .substring(0, 50);
    },

    uploadImage: async (imageFile, folder = 'general', customOptions = {}, customName = null) => {
        try {
            const presetOptions = typeof customOptions === 'string' 
                ? StorageService.COMPRESSION_PRESETS[customOptions] || StorageService.COMPRESSION_PRESETS.standard
                : customOptions;

            const options = { 
                maxSizeMB: 1.0,
                maxWidthOrHeight: 2560,
                useWebWorker: true,
                initialQuality: 0.95,
                ...presetOptions 
            };

            if (imageFile.size <= options.maxSizeMB * 1024 * 1024 && !customOptions.initialQuality) {
                return await StorageService.uploadFile(imageFile, folder, customName);
            }

            const compressedFile = await imageCompression(imageFile, options);
            
            const baseName = customName ? StorageService.sanitizeFileName(customName) : 'coupong-image';
            const extension = imageFile.name.split('.').pop();
            const fileName = `${baseName}_${Date.now()}.${extension}`;
            
            const storageRef = ref(storage, `${folder}/${fileName}`);
            const snapshot = await uploadBytes(storageRef, compressedFile);
            return await getDownloadURL(snapshot.ref);

        } catch (error) {
            console.error("Firebase image upload failed:", error);
            throw error;
        }
    },

    uploadFile: async (file, folder = 'general', customName = null) => {
        try {
            const baseName = customName ? StorageService.sanitizeFileName(customName) : 'coupong-file';
            const extension = file.name.split('.').pop();
            const fileName = `${baseName}_${Date.now()}.${extension}`;
            
            const storageRef = ref(storage, `${folder}/${fileName}`);
            const snapshot = await uploadBytes(storageRef, file);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Firebase file upload failed:", error);
            throw error;
        }
    },

    deleteImage: async (imageUrl) => {
        try {
            if (!imageUrl) return;
            const isFirebaseUrl = imageUrl.includes('firebasestorage.googleapis.com') || imageUrl.includes('firebasestorage.app');
            if (!isFirebaseUrl) return;
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        } catch (error) {
            console.error("Error deleting image from storage:", error);
        }
    }
};
