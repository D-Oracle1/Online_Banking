import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface FileValidationOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Validates a file before upload
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  const {
    maxSizeInMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  } = options;

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeInMB}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Uploads an image to Cloudinary
 */
export async function uploadImage(
  file: File,
  folder: string = 'nextbanker'
): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Convert File to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64String}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    return {
      success: true,
      url: result.secure_url,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}

/**
 * Uploads a logo image with specific dimensions
 */
export async function uploadLogo(file: File): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file, {
      maxSizeInMB: 2,
      allowedTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Convert File to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64String}`;

    // Upload to Cloudinary with logo-specific transformations
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'nextbanker/logos',
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    return {
      success: true,
      url: result.secure_url,
    };
  } catch (error) {
    console.error('Error uploading logo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload logo',
    };
  }
}

/**
 * Uploads a favicon with specific dimensions
 */
export async function uploadFavicon(file: File): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file, {
      maxSizeInMB: 1,
      allowedTypes: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'],
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Convert File to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64String}`;

    // Upload to Cloudinary with favicon-specific transformations
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'nextbanker/favicons',
      resource_type: 'image',
      transformation: [
        { width: 64, height: 64, crop: 'fill' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    return {
      success: true,
      url: result.secure_url,
    };
  } catch (error) {
    console.error('Error uploading favicon:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload favicon',
    };
  }
}

/**
 * Uploads a splash screen logo with specific dimensions
 */
export async function uploadSplashLogo(file: File): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file, {
      maxSizeInMB: 2,
      allowedTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Convert File to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64String}`;

    // Upload to Cloudinary with splash logo transformations
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'nextbanker/splash',
      resource_type: 'image',
      transformation: [
        { width: 600, height: 300, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    return {
      success: true,
      url: result.secure_url,
    };
  } catch (error) {
    console.error('Error uploading splash logo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload splash logo',
    };
  }
}

/**
 * Uploads an app icon (PWA) with specific dimensions
 */
export async function uploadAppIcon(file: File): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file, {
      maxSizeInMB: 2,
      allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Convert File to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64String}`;

    // Upload to Cloudinary with app icon transformations
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'nextbanker/icons',
      resource_type: 'image',
      transformation: [
        { width: 512, height: 512, crop: 'fill' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    return {
      success: true,
      url: result.secure_url,
    };
  } catch (error) {
    console.error('Error uploading app icon:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload app icon',
    };
  }
}

/**
 * Deletes an image from Cloudinary using its URL
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract public_id from Cloudinary URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split('.')[0];
    const folder = urlParts.slice(-3, -1).join('/');
    const fullPublicId = `${folder}/${publicId}`;

    await cloudinary.uploader.destroy(fullPublicId);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}
