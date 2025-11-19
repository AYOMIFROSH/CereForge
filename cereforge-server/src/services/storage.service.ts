import supabase from '../config/database';
import logger from '../utils/logger';

const BUCKET_NAME = 'pending-partner-documents';

/**
 * Validate that a file exists in Supabase Storage
 */
export async function validateFileExists(filePath: string): Promise<boolean> {
  if (!filePath) {
    return false;
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(filePath.split('/')[0]); // Get folder name (applicationId)

    if (error) {
      logger.error('Error validating file existence:', error);
      return false;
    }

    // Check if file exists in the list
    const fileName = filePath.split('/').pop();
    const fileExists = data?.some(file => file.name === fileName);

    return fileExists || false;
  } catch (error) {
    logger.error('File validation failed:', error);
    return false;
  }
}

/**
 * Validate multiple file URLs
 */
export async function validateFileUrls(urls: (string | undefined | null)[]): Promise<boolean> {
  const validUrls = urls.filter(url => url && url.trim() !== '');

  if (validUrls.length === 0) {
    // No files to validate (optional uploads)
    return true;
  }

  // Extract file paths from URLs
  const filePaths = validUrls.map(url => {
    // Extract path from Supabase Storage URL
    // Format: https://{project}.supabase.co/storage/v1/object/public/pending-partner-documents/{applicationId}/{file}
    if (!url) return null;
    const match = url.match(/pending-partner-documents\/(.+)$/);
    return match ? match[1] : null;
  }).filter(path => path !== null) as string[];

  if (filePaths.length !== validUrls.length) {
    logger.warn('Some file URLs have invalid format');
    return false;
  }

  // Validate each file exists
  const validations = await Promise.all(
    filePaths.map(path => validateFileExists(path))
  );

  const allValid = validations.every(isValid => isValid);

  if (!allValid) {
    logger.warn('Some files do not exist in storage');
  }

  return allValid;
}

/**
 * Generate signed URL for file download (valid for 1 hour)
 */
export async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      logger.error('Error generating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    logger.error('Signed URL generation failed:', error);
    return null;
  }
}

/**
 * Delete files from storage (cleanup on rejection/deletion)
 */
export async function deleteApplicationFiles(applicationId: string): Promise<boolean> {
  try {
    // List all files in application folder
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(applicationId);

    if (listError || !files || files.length === 0) {
      logger.warn(`No files found for application ${applicationId}`);
      return true; // Nothing to delete
    }

    // Delete all files
    const filePaths = files.map(file => `${applicationId}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths);

    if (deleteError) {
      logger.error(`Failed to delete files for application ${applicationId}:`, deleteError);
      return false;
    }

    logger.info(`Deleted ${filePaths.length} files for application ${applicationId}`);
    return true;
  } catch (error) {
    logger.error('File deletion failed:', error);
    return false;
  }
}