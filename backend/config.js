const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
  port: process.env.PORT || 3001,
  apiKey: process.env.API_KEY || '',
  databasePath: process.env.DATABASE_PATH || './database/status.db',
  google: {
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
    outputFolderId: process.env.GOOGLE_DRIVE_OUTPUT_FOLDER_ID,
    inputFolderId: process.env.GOOGLE_DRIVE_INPUT_FOLDER_ID,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'https://statuspr.onrender.com/api/drive/callback',
  },
};
