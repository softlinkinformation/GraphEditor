# Drive to Cloud Storage Sync Agent - Setup Guide

This agent automatically syncs files from a Google Drive folder to Google Cloud Storage every 6 hours.

## Prerequisites

- Node.js 14 or higher
- A Google Cloud Platform (GCP) project
- Access to Google Drive
- Access to Google Cloud Storage

## Setup Instructions

### 1. Install Dependencies

```bash
cd drive-to-cloud-sync-agent
npm install
```

### 2. Set Up Google Drive API Access

#### Option A: Using a Service Account (Recommended for automation)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google Drive API
3. Create a Service Account:
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Give it a name like "drive-sync-agent"
   - Click "Create and Continue"
   - Skip granting roles (click "Continue")
   - Click "Done"
4. Create and download credentials:
   - Click on the service account you just created
   - Go to the "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Save as `credentials/google-drive-credentials.json`
5. Share your Google Drive folder with the service account email (found in the JSON file)

#### Option B: Using OAuth2 (For personal use)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google Drive API
3. Create OAuth 2.0 credentials:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Desktop app"
   - Download the credentials JSON
   - Save as `credentials/google-drive-credentials.json`

### 3. Set Up Google Cloud Storage

1. Enable the Cloud Storage API in your GCP project
2. Create a Service Account for Cloud Storage:
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Give it a name like "gcs-sync-agent"
   - Grant the role: "Storage Object Admin"
   - Create and download the JSON key
   - Save as `credentials/gcs-service-account.json`
3. Create a bucket or use an existing one:
   ```bash
   gsutil mb gs://your-bucket-name
   ```

### 4. Configure the Agent

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration:

```env
# Get your Drive folder ID from the URL when viewing it in browser
# Example: https://drive.google.com/drive/folders/1ABC-def2GHI3jkl4MNO
# The folder ID is: 1ABC-def2GHI3jkl4MNO
GOOGLE_DRIVE_FOLDER_ID=your_actual_folder_id

# Path to your Google Drive credentials
GOOGLE_DRIVE_CREDENTIALS_PATH=./credentials/google-drive-credentials.json

# Your GCP project ID
GCS_PROJECT_ID=your-gcp-project-id

# Your Cloud Storage bucket name
GCS_BUCKET_NAME=your-bucket-name

# Destination folder within the bucket (optional, can be empty)
GCS_DESTINATION_FOLDER=uploads/

# Path to your GCS service account credentials
GCS_CREDENTIALS_PATH=./credentials/gcs-service-account.json

# Sync interval in hours (default: 6)
SYNC_INTERVAL_HOURS=6

# Delete files from Drive after successful sync (default: false)
DELETE_FROM_DRIVE_AFTER_SYNC=false

# Log level: error, warn, info, debug
LOG_LEVEL=info
```

### 5. Create Credentials Directory

```bash
mkdir -p credentials
# Place your credential files here:
# - credentials/google-drive-credentials.json
# - credentials/gcs-service-account.json
```

### 6. Test the Setup

Run a test sync to verify everything works:

```bash
npm test
```

### 7. Run the Agent

Start the agent (it will run continuously):

```bash
npm start
```

Or run in background:

```bash
nohup npm start > sync-agent.log 2>&1 &
```

## Running as a Service

### Using systemd (Linux)

1. Create a service file `/etc/systemd/system/drive-sync-agent.service`:

```ini
[Unit]
Description=Drive to Cloud Storage Sync Agent
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/drive-to-cloud-sync-agent
ExecStart=/usr/bin/node sync-agent.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

2. Enable and start the service:

```bash
sudo systemctl enable drive-sync-agent
sudo systemctl start drive-sync-agent
sudo systemctl status drive-sync-agent
```

### Using PM2 (Node.js Process Manager)

```bash
npm install -g pm2
pm2 start sync-agent.js --name drive-sync-agent
pm2 save
pm2 startup
```

## Deployment Options

### Option 1: Google Cloud Run (Scheduled)

Deploy as a Cloud Run job with Cloud Scheduler:

```bash
# Build and deploy
gcloud run jobs create drive-sync-agent \
  --image gcr.io/YOUR_PROJECT/drive-sync-agent \
  --region us-central1

# Schedule it
gcloud scheduler jobs create http drive-sync-schedule \
  --schedule="0 */6 * * *" \
  --uri="https://YOUR_CLOUD_RUN_URL"
```

### Option 2: Google Compute Engine VM

1. Create a VM instance
2. SSH into the VM
3. Clone your code
4. Follow the setup steps above
5. Run as a systemd service

### Option 3: Google Kubernetes Engine

Create a CronJob in Kubernetes:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: drive-sync-agent
spec:
  schedule: "0 */6 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: sync-agent
            image: gcr.io/YOUR_PROJECT/drive-sync-agent
            envFrom:
            - configMapRef:
                name: sync-agent-config
          restartPolicy: OnFailure
```

## Monitoring

View logs:

```bash
# If running directly
tail -f sync-agent.log

# If using systemd
sudo journalctl -u drive-sync-agent -f

# If using PM2
pm2 logs drive-sync-agent
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify credential files exist and are valid JSON
   - Ensure service account has access to the Drive folder
   - Check that APIs are enabled in GCP Console

2. **Permission Errors**
   - Verify the Drive folder is shared with the service account email
   - Check GCS service account has "Storage Object Admin" role
   - Ensure bucket exists and is accessible

3. **Files Not Syncing**
   - Check the folder ID is correct
   - Verify files aren't Google Workspace native files (Docs, Sheets, etc.)
   - Check logs for specific errors

4. **Network/Connection Issues**
   - Ensure outbound HTTPS (443) is allowed
   - Check for firewall rules blocking Google APIs
   - Verify internet connectivity

## Security Best Practices

1. **Credentials**
   - Never commit credential files to git
   - Use environment variables for sensitive data
   - Rotate service account keys regularly

2. **Access Control**
   - Use least-privilege principle for service accounts
   - Limit Drive folder sharing to specific accounts
   - Use GCS bucket policies to restrict access

3. **Monitoring**
   - Set up alerts for sync failures
   - Monitor bucket storage costs
   - Review access logs regularly

## Support

For issues or questions, check the logs first and refer to:
- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
