const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function generateCommentsPDF(videoName, comments, duration) {
  return new Promise((resolve, reject) => {
    const fileName = `${videoName.replace(/[^a-z0-9]/gi, '_')}_comments_${Date.now()}.pdf`;
    const filePath = path.join('/tmp', fileName);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Video Review Report', { underline: true });
    doc.fontSize(11).font('Helvetica').text(`Video: ${videoName}`, { underline: false });
    doc.text(`Duration: ${duration}`);
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    // Stats
    const resolved = comments.filter(c => c.is_checked).length;
    const total = comments.length;
    doc.fontSize(12).font('Helvetica-Bold').text('Summary', { underline: true });
    doc.fontSize(11).font('Helvetica');
    doc.text(`Total Comments: ${total}`);
    doc.text(`Resolved: ${resolved}`);
    doc.text(`Pending: ${total - resolved}`);
    doc.text(`Completion: ${total > 0 ? ((resolved / total) * 100).toFixed(1) : 0}%`);
    doc.moveDown();

    // Comments
    doc.fontSize(12).font('Helvetica-Bold').text('Comments & Feedback', { underline: true });
    doc.moveDown();

    comments.forEach((comment, idx) => {
      const time = formatTime(comment.timestamp_seconds);
      const status = comment.is_checked ? '✓ Resolved' : '⏳ Pending';

      doc.fontSize(11).font('Helvetica-Bold').text(`[${time}] ${comment.manager_name}:`, {
        lineGap: 2
      });
      doc.fontSize(10).font('Helvetica').text(comment.comment_text, {
        lineGap: 3
      });
      doc.fontSize(9).fillColor('#666666').text(`Status: ${status}`, {
        lineGap: 1
      });
      doc.fillColor('#000000');
      doc.moveDown();

      if (idx < comments.length - 1) {
        doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke('#e0e0e0');
        doc.moveDown();
      }
    });

    // Footer
    doc.fontSize(8).fillColor('#999999');
    doc.text('StatusPR - Video Review System | Generated automatically', {
      align: 'center'
    });

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

module.exports = { generateCommentsPDF };
