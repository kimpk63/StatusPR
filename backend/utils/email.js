const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendCommentNotification(managerName, employeeEmail, videoName, commentText, videoId) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: employeeEmail,
    subject: `📝 New Comment on "${videoName}" from ${managerName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px; border-radius: 8px;">
        <div style="background: #1e293b; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="margin: 0;">📝 New Comment Received</h2>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #1e293b; font-size: 16px;">Hi,</p>
          
          <p style="color: #475569; font-size: 15px;">
            <strong style="color: #2563eb;">${managerName}</strong> has left a comment on your video:
          </p>
          
          <div style="background: #f1f5f9; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; border-radius: 4px;">
            <strong style="color: #1e293b; display: block; margin-bottom: 8px;">📹 ${videoName}</strong>
            <div style="color: #475569; font-style: italic;">"${commentText}"</div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/video/${videoId}" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View Comment
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
            StatusPR - Video Review System<br/>
            © 2026 All rights reserved
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('[Email] Comment notification sent to', employeeEmail);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
}

async function sendVideoApprovedNotification(employeeEmail, videoName, managerName) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: employeeEmail,
    subject: `✅ Video Approved: "${videoName}"`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">✅ Video Approved!</h2>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #1e293b; font-size: 16px;">Congratulations!</p>
          
          <p style="color: #475569; font-size: 15px;">
            Your video has been approved by <strong style="color: #16a34a;">${managerName}</strong>
          </p>
          
          <div style="background: #dcfce7; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0; border-radius: 4px;">
            <strong style="color: #166534; display: block; margin-bottom: 8px;">📹 ${videoName}</strong>
            <div style="color: #15803d; font-weight: bold;">Status: APPROVED ✓</div>
          </div>
          
          <p style="color: #475569; font-size: 15px;">
            Thank you for your excellent work! Your video is now complete.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
            StatusPR - Video Review System<br/>
            © 2026 All rights reserved
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('[Email] Approval notification sent to', employeeEmail);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
}

async function sendNeedsRevisionNotification(employeeEmail, videoName, managerName, commentCount, videoId) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: employeeEmail,
    subject: `🔄 Revision Needed: "${videoName}"`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">🔄 Revision Needed</h2>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #1e293b; font-size: 16px;">Hi,</p>
          
          <p style="color: #475569; font-size: 15px;">
            <strong style="color: #dc2626;">${managerName}</strong> has requested changes on your video.
          </p>
          
          <div style="background: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 4px;">
            <strong style="color: #7f1d1d; display: block; margin-bottom: 8px;">📹 ${videoName}</strong>
            <div style="color: #991b1b;">Status: <span style="font-weight: bold;">NEEDS REVISION</span></div>
            <div style="color: #991b1b; margin-top: 8px;">Comments to review: <strong>${commentCount}</strong></div>
          </div>
          
          <p style="color: #475569; font-size: 15px;">
            Please review the feedback and make the necessary changes.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/video/${videoId}" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View Feedback
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
            StatusPR - Video Review System<br/>
            © 2026 All rights reserved
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('[Email] Revision notification sent to', employeeEmail);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
}

module.exports = {
  sendCommentNotification,
  sendVideoApprovedNotification,
  sendNeedsRevisionNotification
};