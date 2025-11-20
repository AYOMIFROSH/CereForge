import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

// Create Supabase client for file uploads
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = 'pending-partner-documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Image compression settings
const IMAGE_MAX_WIDTH = 1920;
const IMAGE_MAX_HEIGHT = 1080;
const IMAGE_QUALITY = 0.85; // 85% quality (good balance)

// Allowed file types
const ALLOWED_MIME_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png']
};

interface UploadResult {
  url: string;
  path: string;
  fileName: string;
  fileSize: number;
  originalSize: number;
  compressionRatio?: number;
}

interface UploadError {
  error: string;
  field: string;
}

/**
 * ⚡ Compress image file before upload
 */
async function compressImage(file: File): Promise<File> {
  // Only compress images
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (maintain aspect ratio)
        let width = img.width;
        let height = img.height;
        
        if (width > IMAGE_MAX_WIDTH || height > IMAGE_MAX_HEIGHT) {
          const ratio = Math.min(IMAGE_MAX_WIDTH / width, IMAGE_MAX_HEIGHT / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw image with optimization
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // Create new file from blob
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            
            console.log(`✅ Compressed ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB (${((1 - compressedFile.size / file.size) * 100).toFixed(0)}% reduction)`);
            
            resolve(compressedFile);
          },
          file.type,
          IMAGE_QUALITY
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate file before upload
 */
function validateFile(file: File, fieldName: string): UploadError | null {
  // Check file size (before compression)
  if (file.size > MAX_FILE_SIZE) {
    return {
      error: `File size must be less than 10MB`,
      field: fieldName
    };
  }

  // Check file type
  if (!Object.keys(ALLOWED_MIME_TYPES).includes(file.type)) {
    return {
      error: `Invalid file type. Allowed: PDF, DOCX, PPTX, JPG, PNG`,
      field: fieldName
    };
  }

  return null;
}

/**
 * ⚡ Upload single file to Supabase Storage (optimized)
 */
export async function uploadFile(
  file: File,
  applicationId: string,
  fileType: 'project-brief' | 'reference-images' | 'profile-photo',
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const originalSize = file.size;
  
  // Validate file
  const validation = validateFile(file, fileType);
  if (validation) {
    throw new Error(validation.error);
  }

  onProgress?.(10);

  // ⚡ Compress image files
  let fileToUpload = file;
  if (file.type.startsWith('image/')) {
    try {
      fileToUpload = await compressImage(file);
      onProgress?.(30);
    } catch (error) {
      console.warn('Image compression failed, uploading original:', error);
      fileToUpload = file;
    }
  }

  onProgress?.(40);

  // Generate unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${fileType}.${fileExt}`;
  const filePath = `${applicationId}/${fileName}`;

  onProgress?.(50);

  // ⚡ Upload to Supabase Storage with optimized settings
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileToUpload, {
      cacheControl: '31536000', // Cache for 1 year (optimized)
      upsert: false,
      contentType: file.type
    });

  if (error) {
    console.error(`Upload failed for ${fileType}:`, error);
    throw new Error(`Failed to upload ${fileType}: ${error.message}`);
  }

  onProgress?.(100);

  const compressionRatio = originalSize > 0 ? fileToUpload.size / originalSize : 1;

  return {
    url: data.path, // Return path for storage
    path: data.path,
    fileName: file.name,
    fileSize: fileToUpload.size,
    originalSize,
    compressionRatio
  };
}

/**
 * ⚡ Upload multiple files in parallel (optimized)
 */
export async function uploadApplicationFiles(
  files: {
    projectBrief?: File | null;
    referenceImages?: File | null;
    profilePhoto?: File | null;
  },
  onProgress?: (overall: number, fileProgress: { [key: string]: number }) => void
): Promise<{
  projectBriefUrl?: string;
  referenceImagesUrl?: string;
  profilePhotoUrl?: string;
  applicationId: string;
  totalSaved?: number; // Bytes saved through compression
}> {
  // Generate unique application ID
  const applicationId = uuidv4();

  const fileProgress: { [key: string]: number } = {
    projectBrief: 0,
    referenceImages: 0,
    profilePhoto: 0
  };

  const updateProgress = () => {
    const filesUploading = Object.keys(fileProgress).length;
    const totalProgress = Object.values(fileProgress).reduce((a, b) => a + b, 0) / filesUploading;
    onProgress?.(totalProgress, fileProgress);
  };

  const uploadPromises: Promise<{ type: string; result: UploadResult }>[] = [];

  // Upload project brief
  if (files.projectBrief) {
    uploadPromises.push(
      uploadFile(
        files.projectBrief,
        applicationId,
        'project-brief',
        (progress) => {
          fileProgress.projectBrief = progress;
          updateProgress();
        }
      ).then(result => ({ type: 'projectBrief', result }))
    );
  } else {
    delete fileProgress.projectBrief;
  }

  // Upload reference images
  if (files.referenceImages) {
    uploadPromises.push(
      uploadFile(
        files.referenceImages,
        applicationId,
        'reference-images',
        (progress) => {
          fileProgress.referenceImages = progress;
          updateProgress();
        }
      ).then(result => ({ type: 'referenceImages', result }))
    );
  } else {
    delete fileProgress.referenceImages;
  }

  // Upload profile photo
  if (files.profilePhoto) {
    uploadPromises.push(
      uploadFile(
        files.profilePhoto,
        applicationId,
        'profile-photo',
        (progress) => {
          fileProgress.profilePhoto = progress;
          updateProgress();
        }
      ).then(result => ({ type: 'profilePhoto', result }))
    );
  } else {
    delete fileProgress.profilePhoto;
  }

  // ⚡ Wait for all uploads to complete (parallel)
  const results = await Promise.all(uploadPromises);

  // Build result object
  const uploadedFiles: any = { applicationId };
  let totalSaved = 0;

  results.forEach(({ type, result }) => {
    if (type === 'projectBrief') {
      uploadedFiles.projectBriefUrl = result.path;
    } else if (type === 'referenceImages') {
      uploadedFiles.referenceImagesUrl = result.path;
    } else if (type === 'profilePhoto') {
      uploadedFiles.profilePhotoUrl = result.path;
    }
    
    // Calculate total bytes saved
    totalSaved += (result.originalSize - result.fileSize);
  });

  uploadedFiles.totalSaved = totalSaved;

  console.log(`💾 Total bandwidth saved: ${(totalSaved / 1024).toFixed(1)}KB`);

  return uploadedFiles;
}

/**
 * Delete uploaded files (cleanup on error)
 */
export async function deleteUploadedFiles(applicationId: string): Promise<void> {
  try {
    const { data: files } = await supabase.storage
      .from(BUCKET_NAME)
      .list(applicationId);

    if (files && files.length > 0) {
      const filePaths = files.map(file => `${applicationId}/${file.name}`);
      
      await supabase.storage
        .from(BUCKET_NAME)
        .remove(filePaths);
      
      console.log(`🗑️ Cleaned up ${filePaths.length} files`);
    }
  } catch (error) {
    console.error('Failed to cleanup uploaded files:', error);
  }
}