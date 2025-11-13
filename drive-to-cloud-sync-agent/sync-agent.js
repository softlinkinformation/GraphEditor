const { google } = require('googleapis');
const { Storage } = require('@google-cloud/storage');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class DriveSyncAgent {
  constructor() {
    this.config = {
      driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
      driveCredentialsPath: process.env.GOOGLE_DRIVE_CREDENTIALS_PATH,
      gcsProjectId: process.env.GCS_PROJECT_ID,
      gcsBucketName: process.env.GCS_BUCKET_NAME,
      gcsDestinationFolder: process.env.GCS_DESTINATION_FOLDER || '',
      gcsCredentialsPath: process.env.GCS_CREDENTIALS_PATH,
      syncIntervalHours: parseInt(process.env.SYNC_INTERVAL_HOURS) || 6,
      deleteAfterSync: process.env.DELETE_FROM_DRIVE_AFTER_SYNC === 'true',
      logLevel: process.env.LOG_LEVEL || 'info'
    };

    this.driveClient = null;
    this.storageClient = null;
    this.syncedFiles = new Set();
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logLevels = { error: 0, warn: 1, info: 2, debug: 3 };
    
    if (logLevels[level] <= logLevels[this.config.logLevel]) {
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
      if (data) console.log(JSON.stringify(data, null, 2));
    }
  }

  async initialize() {
    try {
      this.log('info', 'Initializing Drive Sync Agent...');
      
      // Initialize Google Drive API
      await this.initializeDriveClient();
      
      // Initialize Google Cloud Storage
      await this.initializeStorageClient();
      
      this.log('info', 'Agent initialized successfully');
      return true;
    } catch (error) {
      this.log('error', 'Failed to initialize agent', { error: error.message });
      throw error;
    }
  }

  async initializeDriveClient() {
    try {
      const credentials = JSON.parse(
        fs.readFileSync(this.config.driveCredentialsPath, 'utf8')
      );

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });

      this.driveClient = google.drive({ version: 'v3', auth });
      this.log('info', 'Google Drive client initialized');
    } catch (error) {
      this.log('error', 'Failed to initialize Drive client', { error: error.message });
      throw new Error(`Drive initialization failed: ${error.message}`);
    }
  }

  async initializeStorageClient() {
    try {
      this.storageClient = new Storage({
        projectId: this.config.gcsProjectId,
        keyFilename: this.config.gcsCredentialsPath
      });

      // Verify bucket exists
      const [exists] = await this.storageClient.bucket(this.config.gcsBucketName).exists();
      if (!exists) {
        throw new Error(`Bucket ${this.config.gcsBucketName} does not exist`);
      }

      this.log('info', 'Google Cloud Storage client initialized');
    } catch (error) {
      this.log('error', 'Failed to initialize Storage client', { error: error.message });
      throw new Error(`Storage initialization failed: ${error.message}`);
    }
  }

  async listDriveFiles() {
    try {
      this.log('info', `Listing files in Drive folder: ${this.config.driveFolderId}`);
      
      const response = await this.driveClient.files.list({
        q: `'${this.config.driveFolderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, size, modifiedTime, md5Checksum)',
        pageSize: 1000
      });

      const files = response.data.files || [];
      this.log('info', `Found ${files.length} file(s) in Drive folder`);
      
      return files;
    } catch (error) {
      this.log('error', 'Failed to list Drive files', { error: error.message });
      throw error;
    }
  }

  async downloadDriveFile(fileId, fileName) {
    try {
      this.log('debug', `Downloading file from Drive: ${fileName}`);
      
      const dest = fs.createWriteStream(path.join('/tmp', fileName));
      const response = await this.driveClient.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      return new Promise((resolve, reject) => {
        response.data
          .on('end', () => {
            this.log('debug', `Download complete: ${fileName}`);
            resolve(path.join('/tmp', fileName));
          })
          .on('error', (err) => {
            this.log('error', `Download failed: ${fileName}`, { error: err.message });
            reject(err);
          })
          .pipe(dest);
      });
    } catch (error) {
      this.log('error', `Failed to download file: ${fileName}`, { error: error.message });
      throw error;
    }
  }

  async uploadToCloudStorage(localFilePath, fileName) {
    try {
      this.log('debug', `Uploading to Cloud Storage: ${fileName}`);
      
      const bucket = this.storageClient.bucket(this.config.gcsBucketName);
      const destinationPath = path.join(this.config.gcsDestinationFolder, fileName).replace(/\\/g, '/');
      
      await bucket.upload(localFilePath, {
        destination: destinationPath,
        metadata: {
          metadata: {
            uploadedBy: 'drive-sync-agent',
            uploadedAt: new Date().toISOString()
          }
        }
      });

      this.log('info', `Successfully uploaded: ${fileName} to gs://${this.config.gcsBucketName}/${destinationPath}`);
      return true;
    } catch (error) {
      this.log('error', `Failed to upload file: ${fileName}`, { error: error.message });
      throw error;
    }
  }

  async deleteFromDrive(fileId, fileName) {
    try {
      if (!this.config.deleteAfterSync) {
        return;
      }

      this.log('debug', `Deleting from Drive: ${fileName}`);
      await this.driveClient.files.delete({ fileId });
      this.log('info', `Deleted from Drive: ${fileName}`);
    } catch (error) {
      this.log('error', `Failed to delete file from Drive: ${fileName}`, { error: error.message });
      // Don't throw - deletion failure shouldn't break the sync
    }
  }

  async syncFiles() {
    const startTime = Date.now();
    this.log('info', '=== Starting sync operation ===');

    try {
      // List files in Google Drive
      const driveFiles = await this.listDriveFiles();

      if (driveFiles.length === 0) {
        this.log('info', 'No files to sync');
        return { success: true, filesProcessed: 0, errors: [] };
      }

      const results = {
        success: true,
        filesProcessed: 0,
        filesUploaded: 0,
        filesSkipped: 0,
        errors: []
      };

      // Process each file
      for (const file of driveFiles) {
        try {
          // Skip Google Workspace files (Docs, Sheets, etc.)
          if (file.mimeType.startsWith('application/vnd.google-apps')) {
            this.log('info', `Skipping Google Workspace file: ${file.name}`);
            results.filesSkipped++;
            continue;
          }

          this.log('info', `Processing file: ${file.name} (${this.formatBytes(file.size)})`);

          // Download from Drive
          const localPath = await this.downloadDriveFile(file.id, file.name);

          // Upload to Cloud Storage
          await this.uploadToCloudStorage(localPath, file.name);

          // Clean up local file
          fs.unlinkSync(localPath);

          // Optionally delete from Drive
          await this.deleteFromDrive(file.id, file.name);

          results.filesUploaded++;
          this.syncedFiles.add(file.id);
        } catch (error) {
          results.errors.push({
            fileName: file.name,
            error: error.message
          });
          results.success = false;
        }

        results.filesProcessed++;
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.log('info', `=== Sync completed in ${duration}s ===`, results);

      return results;
    } catch (error) {
      this.log('error', 'Sync operation failed', { error: error.message });
      throw error;
    }
  }

  formatBytes(bytes) {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  startScheduledSync() {
    // Run immediately on start
    this.log('info', 'Running initial sync...');
    this.syncFiles().catch(err => {
      this.log('error', 'Initial sync failed', { error: err.message });
    });

    // Schedule recurring sync every N hours
    const cronExpression = `0 */${this.config.syncIntervalHours} * * *`;
    this.log('info', `Scheduling sync with cron: ${cronExpression} (every ${this.config.syncIntervalHours} hours)`);

    cron.schedule(cronExpression, async () => {
      this.log('info', 'Scheduled sync triggered');
      try {
        await this.syncFiles();
      } catch (error) {
        this.log('error', 'Scheduled sync failed', { error: error.message });
      }
    });

    this.log('info', 'Agent is running. Press Ctrl+C to stop.');
  }
}

// Main execution
async function main() {
  const agent = new DriveSyncAgent();

  try {
    await agent.initialize();
    
    // Check if running in test mode
    if (process.argv.includes('--test')) {
      console.log('Running in test mode - single sync only');
      const results = await agent.syncFiles();
      process.exit(results.success ? 0 : 1);
    } else {
      // Start scheduled sync
      agent.startScheduledSync();
    }
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

// Start the agent
if (require.main === module) {
  main();
}

module.exports = DriveSyncAgent;
