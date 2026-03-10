const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const TOKEN_PATH = path.join(__dirname, '..', 'database', 'drive-tokens.json');

let oauth2Client = null;

function getOAuth2Client() {
  if (!config.google.clientId || !config.google.clientSecret) return null;
  if (oauth2Client) return oauth2Client;
  oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
  return oauth2Client;
}

function hasTokens() {
  try {
    const tokens = getOrRefreshTokens();
    return tokens && !!tokens.access_token;
  } catch {
    return false;
  }
}

function getAuthUrl() {
  const client = getOAuth2Client();
  if (!client) return null;
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.readonly'],
    prompt: 'consent',
  });
}

async function handleCallback(code) {
  const client = getOAuth2Client();
  if (!client) throw new Error('Google Drive not configured');
  const { tokens } = await client.getToken(code);
  
  // บันทึก Token ทั้งในไฟล์และ Environment
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  process.env.GOOGLE_DRIVE_TOKEN = JSON.stringify(tokens);
  
  client.setCredentials(tokens);
  console.log('[Google Drive] Token saved successfully');
}

function getOrRefreshTokens() {
  try {
    // ลองอ่าน Environment ก่อน (ถาวร)
    if (process.env.GOOGLE_DRIVE_TOKEN) {
      return JSON.parse(process.env.GOOGLE_DRIVE_TOKEN);
    }
    
    // ถ้าไม่มี ให้อ่านจาก file
    const data = fs.readFileSync(TOKEN_PATH, 'utf8');
    const tokens = JSON.parse(data);
    
    // บันทึก Environment ด้วย
    process.env.GOOGLE_DRIVE_TOKEN = JSON.stringify(tokens);
    
    return tokens;
  } catch (err) {
    console.log('[Google Drive] No tokens found:', err.message);
    return null;
  }
}

async function getDriveClient() {
  const client = getOAuth2Client();
  if (!client) return null;
  const tokens = getOrRefreshTokens();
  if (!tokens) return null;
  client.setCredentials(tokens);
  client.on('tokens', (newTokens) => {
    const existing = getOrRefreshTokens() || {};
    const updated = { ...existing, ...newTokens };
    
    // บันทึกทั้งไฟล์และ Environment
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(updated, null, 2));
    process.env.GOOGLE_DRIVE_TOKEN = JSON.stringify(updated);
    
    console.log('[Google Drive] Token refreshed and saved');
  });
  const drive = google.drive({ version: 'v3', auth: client });
  return drive;
}

module.exports = {
  getOAuth2Client,
  getAuthUrl,
  handleCallback,
  getOrRefreshTokens,
  hasTokens,
  getDriveClient,
};