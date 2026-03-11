const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs').promises;

ffmpeg.setFfmpegPath(ffmpegStatic);

async function getVideoMetadata(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      const duration = Math.round(metadata.format.duration); // seconds
      const fileSize = metadata.format.size; // bytes
      const bitrate = metadata.format.bit_rate;

      resolve({
        duration,
        durationFormatted: formatDuration(duration),
        fileSize,
        fileSizeFormatted: formatFileSize(fileSize),
        bitrate,
        bitrateFormatted: formatBitrate(bitrate)
      });
    });
  });
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function formatBitrate(bitrate) {
  return `${(bitrate / 1000000).toFixed(1)} Mbps`;
}

module.exports = {
  getVideoMetadata,
  formatDuration,
  formatFileSize,
  formatBitrate
};