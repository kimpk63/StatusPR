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
    const data = fs.readFileSync(TOKEN_PATH, 'utf8');
    return !!JSON.parse(data).access_token;
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
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  client.setCredentials(tokens);
}

function getOrRefreshTokens() {
  try {
    const data = fs.readFileSync(TOKEN_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
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
    fs.writeFileSync(TOKEN_PATH, JSON.stringify({ ...existing, ...newTokens }, null, 2));
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
