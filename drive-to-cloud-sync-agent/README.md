# Drive to Cloud Storage Sync Agent

🔄 Automated agent that syncs files from Google Drive to Google Cloud Storage every 6 hours.

## Features

- ✅ Automatic synchronization every 6 hours (configurable)
- ✅ Supports all file types (except Google Workspace native files)
- ✅ Handles large files efficiently with streaming
- ✅ Comprehensive logging and error handling
- ✅ Optional deletion from Drive after successful sync
- ✅ Production-ready with proper error handling
- ✅ Easy deployment to various platforms

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up credentials** (see [SETUP.md](SETUP.md) for detailed instructions)
   - Create Google Drive API credentials
   - Create Google Cloud Storage service account
   - Place JSON files in `credentials/` directory

3. **Configure the agent:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Test the setup:**
   ```bash
   npm test
   ```

5. **Run the agent:**
   ```bash
   npm start
   ```

## Configuration

Edit `.env` file to configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_DRIVE_FOLDER_ID` | ID of the source Google Drive folder | Yes |
| `GOOGLE_DRIVE_CREDENTIALS_PATH` | Path to Drive API credentials JSON | Yes |
| `GCS_PROJECT_ID` | Google Cloud project ID | Yes |
| `GCS_BUCKET_NAME` | Destination Cloud Storage bucket | Yes |
| `GCS_DESTINATION_FOLDER` | Folder path within bucket (e.g., "uploads/") | No |
| `GCS_CREDENTIALS_PATH` | Path to GCS service account JSON | Yes |
| `SYNC_INTERVAL_HOURS` | Hours between syncs (default: 6) | No |
| `DELETE_FROM_DRIVE_AFTER_SYNC` | Delete from Drive after upload (default: false) | No |
| `LOG_LEVEL` | Logging level: error, warn, info, debug | No |

## How It Works

1. **Discovery**: Agent checks the specified Google Drive folder for files
2. **Download**: Downloads each file to a temporary location
3. **Upload**: Uploads the file to Google Cloud Storage
4. **Cleanup**: Removes temporary files (and optionally from Drive)
5. **Schedule**: Waits for the next scheduled run (default: 6 hours)

## Architecture

```
┌─────────────────┐
│  Google Drive   │
│     Folder      │
└────────┬────────┘
         │
         │ Every 6 hours
         ▼
┌─────────────────┐
│   Sync Agent    │
│  (Node.js App)  │
└────────┬────────┘
         │
         │ Upload
         ▼
┌─────────────────┐
│ Cloud Storage   │
│     Bucket      │
└─────────────────┘
```

## Deployment

The agent can be deployed on:

- **Local Server**: Run with PM2 or systemd
- **Google Compute Engine**: VM with systemd service
- **Google Cloud Run**: Scheduled Cloud Run jobs
- **Google Kubernetes Engine**: Kubernetes CronJob
- **Any Linux server**: With Docker or native Node.js

See [SETUP.md](SETUP.md) for detailed deployment instructions.

## Monitoring

The agent provides detailed logs at different levels:

```bash
# View real-time logs
tail -f sync-agent.log

# Or if using PM2
pm2 logs drive-sync-agent
```

Log levels:
- `error`: Critical failures
- `warn`: Important warnings
- `info`: General operational information (default)
- `debug`: Detailed debugging information

## File Support

### Supported Files
- All standard file types (PDF, images, videos, ZIP, etc.)
- Binary files
- Large files (streamed efficiently)

### Not Supported
- Google Docs (native)
- Google Sheets (native)
- Google Slides (native)
- Other Google Workspace native formats

*Note: You can export these to standard formats before syncing*

## Security

- Credentials stored locally, never in code
- Service account authentication
- Least-privilege access model
- Audit logs available in GCP Console

**Important**: Never commit credential files to version control!

## Troubleshooting

See [SETUP.md](SETUP.md) for common issues and solutions.

## License

MIT License - Feel free to modify and use as needed.

## Support

For detailed setup instructions, see [SETUP.md](SETUP.md).

For issues, check the logs and ensure:
1. All credentials are properly configured
2. APIs are enabled in GCP Console
3. Service accounts have proper permissions
4. Drive folder is shared with the service account
