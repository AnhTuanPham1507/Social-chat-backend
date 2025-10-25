import { randomUUID } from 'crypto';

/**
 * Serializes a filename by removing or replacing special characters and spaces
 * to make it URL-safe and filesystem-friendly
 *
 * @param fileName - The original filename
 * @param preserveExtension - Whether to preserve the file extension (default: true)
 * @returns A serialized filename safe for URLs and file systems
 */
export function serializeFileName(
    fileName: string,
    preserveExtension: boolean = true,
): string {
    if (!fileName || typeof fileName !== 'string') {
        return `file_${randomUUID()}`;
    }

    // Extract file extension if preserveExtension is true
    const lastDotIndex = fileName.lastIndexOf('.');
    const extension =
        preserveExtension && lastDotIndex > 0
            ? fileName.substring(lastDotIndex)
            : '';
    const nameWithoutExtension =
        preserveExtension && lastDotIndex > 0
            ? fileName.substring(0, lastDotIndex)
            : fileName;

    // Serialize the filename:
    // 1. Convert to lowercase for consistency
    // 2. Replace spaces with underscores
    // 3. Remove or replace special characters (keep only alphanumeric, underscores, and hyphens)
    // 4. Remove multiple consecutive underscores/hyphens
    // 5. Remove leading/trailing underscores/hyphens
    const serializedName = nameWithoutExtension
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/[^a-z0-9_-]/g, '') // Remove special characters except underscores and hyphens
        .replace(/[_-]+/g, '_') // Replace multiple consecutive underscores/hyphens with single underscore
        .replace(/^[_-]+|[_-]+$/g, ''); // Remove leading/trailing underscores/hyphens

    // If the serialized name is empty or too short, generate a unique name
    if (!serializedName || serializedName.length < 1) {
        return `file_${randomUUID().replace(/-/g, '').substring(0, 8)}${extension}`;
    }

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36); // Convert timestamp to base36 for shorter string

    return `${serializedName}_${timestamp}${extension}`;
}

/**
 * Alternative serialization method that generates a completely unique filename
 * while preserving the original extension
 *
 * @param fileName - The original filename
 * @returns A unique serialized filename
 */
export function generateUniqueFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
        return `file_${randomUUID()}`;
    }

    // Extract file extension
    const lastDotIndex = fileName.lastIndexOf('.');
    const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';

    // Generate unique identifier
    const uniqueId = randomUUID().replace(/-/g, '').substring(0, 12);
    const timestamp = Date.now().toString(36);

    return `file_${timestamp}_${uniqueId}${extension}`;
}
