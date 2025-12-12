/**
 * Google Drive Upload Utility
 * Handles file uploads to Google Drive and returns shareable links
 */

// Google Drive API configuration
const GOOGLE_DRIVE_API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
const GOOGLE_DRIVE_CLIENT_ID = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID;
const GOOGLE_DRIVE_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || 'root';

// Google API scopes
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Initialize Google API client
let gapiInited = false;
let gisInited = false;
let tokenClient: any;

/**
 * Initialize Google API
 */
export const initGoogleDrive = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined'));
      return;
    }

    // Load Google API script
    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    script1.async = true;
    script1.defer = true;
    script1.onload = () => {
      (window as any).gapi.load('client', async () => {
        await (window as any).gapi.client.init({
          apiKey: GOOGLE_DRIVE_API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
        });
        gapiInited = true;
        if (gisInited) resolve();
      });
    };
    document.body.appendChild(script1);

    // Load Google Identity Services script
    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    script2.async = true;
    script2.defer = true;
    script2.onload = () => {
      tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_DRIVE_CLIENT_ID,
        scope: SCOPES,
        callback: '', // Will be set during request
      });
      gisInited = true;
      if (gapiInited) resolve();
    };
    document.body.appendChild(script2);

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!gapiInited || !gisInited) {
        reject(new Error('Failed to initialize Google Drive API'));
      }
    }, 10000);
  });
};

/**
 * Request access token from user
 */
const getAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Check if already have valid token
      const token = (window as any).gapi.client.getToken();
      if (token !== null) {
        resolve(token.access_token);
        return;
      }

      // Request new token
      tokenClient.callback = async (resp: any) => {
        if (resp.error !== undefined) {
          reject(resp);
        }
        resolve(resp.access_token);
      };

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Upload file to Google Drive
 * @param file - File to upload
 * @param fileName - Optional custom file name
 * @returns Object with fileId and viewable link
 */
export const uploadToGoogleDrive = async (
  file: File,
  fileName?: string
): Promise<{ fileId: string; link: string; viewableLink: string }> => {
  try {
    // Initialize if not already done
    if (!gapiInited || !gisInited) {
      await initGoogleDrive();
    }

    // Get access token
    await getAccessToken();

    // Create file metadata
    const metadata = {
      name: fileName || file.name,
      mimeType: file.type,
      parents: GOOGLE_DRIVE_FOLDER_ID !== 'root' ? [GOOGLE_DRIVE_FOLDER_ID] : undefined
    };

    // Create form data
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    // Upload to Drive
    const token = (window as any).gapi.client.getToken();
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.access_token}`
        },
        body: form
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    const fileId = data.id;

    // Make file publicly accessible
    await makeFilePublic(fileId);

    // Generate links
    const shareLink = `https://drive.google.com/file/d/${fileId}/view`;
    const viewableLink = convertToViewableLink(fileId);

    return {
      fileId,
      link: shareLink,
      viewableLink
    };
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error('Failed to upload to Google Drive. Please try again.');
  }
};

/**
 * Make file publicly accessible
 * @param fileId - Google Drive file ID
 */
const makeFilePublic = async (fileId: string): Promise<void> => {
  try {
    const token = (window as any).gapi.client.getToken();
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      }
    );
  } catch (error) {
    console.error('Error making file public:', error);
    // Continue anyway - file might still be accessible
  }
};

/**
 * Convert Google Drive share link to viewable image link
 * @param fileIdOrLink - File ID or full Drive link
 * @returns Direct viewable image link
 */
export const convertToViewableLink = (fileIdOrLink: string): string => {
  // If it's already a file ID, just convert it
  if (!fileIdOrLink.includes('drive.google.com')) {
    return `https://drive.google.com/uc?export=view&id=${fileIdOrLink}`;
  }

  // Extract file ID from various Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = fileIdOrLink.match(pattern);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }

  // If no pattern matched, return original
  return fileIdOrLink;
};

/**
 * Delete file from Google Drive
 * @param fileId - Google Drive file ID
 */
export const deleteFromGoogleDrive = async (fileId: string): Promise<void> => {
  try {
    if (!gapiInited) {
      await initGoogleDrive();
    }

    await getAccessToken();

    const token = (window as any).gapi.client.getToken();
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token.access_token}`
        }
      }
    );
  } catch (error) {
    console.error('Error deleting from Google Drive:', error);
    throw new Error('Failed to delete from Google Drive');
  }
};

/**
 * Extract file ID from Google Drive link
 * @param link - Google Drive link
 * @returns File ID or null
 */
export const extractFileId = (link: string): string | null => {
  if (!link) return null;

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /uc\?export=view&id=([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = link.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Check if Google Drive API is configured
 */
export const isGoogleDriveConfigured = (): boolean => {
  return !!(GOOGLE_DRIVE_API_KEY && GOOGLE_DRIVE_CLIENT_ID);
};
