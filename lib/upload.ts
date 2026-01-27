import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'bank-assets';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface FileValidationOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
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
 * Ensures the storage bucket exists
 */
async function ensureBucketExists(): Promise<boolean> {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
      });
      if (error && !error.message.includes('already exists')) {
        console.error('Error creating bucket:', error);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
}

/**
 * Uploads an image to Supabase Storage
 */
export async function uploadImage(
  file: File,
  folder: string = 'general'
): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Ensure bucket exists
    await ensureBucketExists();

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'png';
    const filename = `${folder}/${timestamp}-${randomString}.${extension}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
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
 * Uploads a logo image
 */
export async function uploadLogo(file: File): Promise<UploadResult> {
  const validation = validateFile(file, {
    maxSizeInMB: 2,
    allowedTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
  });

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  return uploadImage(file, 'logos');
}

/**
 * Uploads a favicon
 */
export async function uploadFavicon(file: File): Promise<UploadResult> {
  const validation = validateFile(file, {
    maxSizeInMB: 1,
    allowedTypes: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/ico'],
  });

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  return uploadImage(file, 'favicons');
}

/**
 * Uploads a splash screen logo
 */
export async function uploadSplashLogo(file: File): Promise<UploadResult> {
  const validation = validateFile(file, {
    maxSizeInMB: 2,
    allowedTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
  });

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  return uploadImage(file, 'splash');
}

/**
 * Uploads an app icon (PWA)
 */
export async function uploadAppIcon(file: File): Promise<UploadResult> {
  const validation = validateFile(file, {
    maxSizeInMB: 2,
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
  });

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  return uploadImage(file, 'icons');
}

/**
 * Deletes an image from Supabase Storage
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split(`/storage/v1/object/public/${BUCKET_NAME}/`);
    if (pathParts.length < 2) {
      return false;
    }
    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}
