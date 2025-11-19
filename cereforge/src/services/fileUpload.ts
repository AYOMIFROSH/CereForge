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
}

interface UploadError {
  error: string;
  field: string;
}

/**
 * Validate file before upload
 */
function validateFile(file: File, fieldName: string): UploadError | null {
  // Check file size
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
 * Upload single file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  applicationId: string,
  fileType: 'project-brief' | 'reference-images' | 'profile-photo'
): Promise<UploadResult> {
  // Validate file
  const validation = validateFile(file, fileType);
  if (validation) {
    throw new Error(validation.error);
  }

  // Generate unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${fileType}.${fileExt}`;
  const filePath = `${applicationId}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false // Don't overwrite existing files
    });

  if (error) {
    console.error(`Upload failed for ${fileType}:`, error);
    throw new Error(`Failed to upload ${fileType}: ${error.message}`);
  }

  // Get public URL (will be signed URL in private bucket)
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    fileName: file.name,
    fileSize: file.size
  };
}

/**
 * Upload multiple files in parallel
 */
export async function uploadApplicationFiles(files: {
  projectBrief?: File | null;
  referenceImages?: File | null;
  profilePhoto?: File | null;
}): Promise<{
  projectBriefUrl?: string;
  referenceImagesUrl?: string;
  profilePhotoUrl?: string;
  applicationId: string;
}> {
  // Generate unique application ID
  const applicationId = uuidv4();

  const uploadPromises: Promise<{ type: string; result: UploadResult }>[] = [];

  // Upload project brief
  if (files.projectBrief) {
    uploadPromises.push(
      uploadFile(files.projectBrief, applicationId, 'project-brief')
        .then(result => ({ type: 'projectBrief', result }))
    );
  }

  // Upload reference images
  if (files.referenceImages) {
    uploadPromises.push(
      uploadFile(files.referenceImages, applicationId, 'reference-images')
        .then(result => ({ type: 'referenceImages', result }))
    );
  }

  // Upload profile photo
  if (files.profilePhoto) {
    uploadPromises.push(
      uploadFile(files.profilePhoto, applicationId, 'profile-photo')
        .then(result => ({ type: 'profilePhoto', result }))
    );
  }

  // Wait for all uploads to complete (parallel)
  const results = await Promise.all(uploadPromises);

  // Build result object
  const uploadedFiles: any = { applicationId };

  results.forEach(({ type, result }) => {
    if (type === 'projectBrief') {
      uploadedFiles.projectBriefUrl = result.path;
    } else if (type === 'referenceImages') {
      uploadedFiles.referenceImagesUrl = result.path;
    } else if (type === 'profilePhoto') {
      uploadedFiles.profilePhotoUrl = result.path;
    }
  });

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
    }
  } catch (error) {
    console.error('Failed to cleanup uploaded files:', error);
  }
}