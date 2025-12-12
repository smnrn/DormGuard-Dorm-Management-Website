const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // For development, use a test account or configure with real SMTP
  // For production, use real SMTP credentials
  
  // Check if SMTP credentials are configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP credentials not configured. Email notifications will not be sent.');
    console.warn('⚠️  Please set SMTP_USER and SMTP_PASS in your .env file');
    return null;
  }
  
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // Your email
      pass: process.env.SMTP_PASS  // Your email password or app password
    }
  });

  return transporter;
};

// Send visitor approval email
const sendVisitorApprovalEmail = async (tenant, visitor) => {
  try {
    const transporter = createTransporter();
    
    // If no transporter (SMTP not configured), log and return
    if (!transporter) {
      console.log('⚠️  Email not sent - SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }
    
    // Validate tenant email
    if (!tenant.email) {
      console.log('⚠️  Email not sent - Tenant email not provided');
      return { success: false, error: 'Tenant email not provided' };
    }

    const mailOptions = {
      from: `"DormGuard System" <${process.env.SMTP_USER}>`,
      to: tenant.email,
      subject: '✅ Visitor Request Approved - DormGuard',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 20px 0; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .info-label { font-weight: bold; min-width: 150px; color: #6b7280; }
            .info-value { color: #1f2937; }
            .access-code { background: #3b82f6; color: white; font-size: 24px; padding: 15px; text-align: center; border-radius: 8px; letter-spacing: 2px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🏢 DormGuard System</h1>
              <p style="margin: 10px 0 0 0;">Visitor Management System</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1e3a8a; margin-top: 0;">Good News, ${tenant.full_name}!</h2>
              
              <div class="success-badge">
                ✅ Visitor Request Approved
              </div>
              
              <p>Your visitor registration has been approved by the administrator. Here are the details:</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #1e3a8a;">Visitor Information</h3>
                <div class="info-row">
                  <span class="info-label">Visitor Name:</span>
                  <span class="info-value">${visitor.full_name}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Contact Number:</span>
                  <span class="info-value">${visitor.contact_number}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Purpose of Visit:</span>
                  <span class="info-value">${visitor.purpose}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Expected Date:</span>
                  <span class="info-value">${new Date(visitor.expected_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Expected Time:</span>
                  <span class="info-value">${visitor.expected_time || 'N/A'}</span>
                </div>
              </div>
              
              <h3 style="color: #1e3a8a;">Digital Access Code</h3>
              <div class="access-code">
                DG-${visitor.room_number}-${visitor.visitor_id}
              </div>
              <p style="text-align: center; color: #6b7280; font-size: 14px;">
                Show this code at the help desk for check-in
              </p>
              
              <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <strong style="color: #1e3a8a;">Important Reminders:</strong>
                <ul style="margin: 10px 0; padding-left: 20px; color: #1f2937;">
                  <li>Visitor must present a valid ID at check-in</li>
                  <li>Access code is valid only for the approved date</li>
                  <li>Please inform your visitor in advance</li>
                  <li>Log in to DormGuard to print the digital pass</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automated message from DormGuard Visitor Management System.</p>
              <p>Please do not reply to this email.</p>
              <p>For assistance, contact the dormitory administration.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Approval email sent to ${tenant.email}`);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't fail the approval if email fails
    return { success: false, error: error.message };
  }
};

// Send visitor denial email
const sendVisitorDenialEmail = async (tenant, visitor, denialReason) => {
  try {
    const transporter = createTransporter();
    
    // If no transporter (SMTP not configured), log and return
    if (!transporter) {
      console.log('⚠️  Email not sent - SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }
    
    // Validate tenant email
    if (!tenant.email) {
      console.log('⚠️  Email not sent - Tenant email not provided');
      return { success: false, error: 'Tenant email not provided' };
    }

    const mailOptions = {
      from: `"DormGuard System" <${process.env.SMTP_USER}>`,
      to: tenant.email,
      subject: '❌ Visitor Request Denied - DormGuard',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .denial-badge { background: #ef4444; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 20px 0; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
            .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .info-label { font-weight: bold; min-width: 150px; color: #6b7280; }
            .info-value { color: #1f2937; }
            .reason-box { background: #fef2f2; border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🏢 DormGuard System</h1>
              <p style="margin: 10px 0 0 0;">Visitor Management System</p>
            </div>
            
            <div class="content">
              <h2 style="color: #991b1b; margin-top: 0;">Dear ${tenant.full_name},</h2>
              
              <div class="denial-badge">
                ❌ Visitor Request Denied
              </div>
              
              <p>We regret to inform you that your visitor registration has been denied by the administrator.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #991b1b;">Visitor Information</h3>
                <div class="info-row">
                  <span class="info-label">Visitor Name:</span>
                  <span class="info-value">${visitor.full_name}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Contact Number:</span>
                  <span class="info-value">${visitor.contact_number}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Purpose of Visit:</span>
                  <span class="info-value">${visitor.purpose}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Expected Date:</span>
                  <span class="info-value">${new Date(visitor.expected_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
              
              <div class="reason-box">
                <strong style="color: #991b1b;">Reason for Denial:</strong>
                <p style="margin: 10px 0 0 0; color: #1f2937;">${denialReason || 'Not specified by administrator'}</p>
              </div>
              
              <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <strong style="color: #1e3a8a;">Next Steps:</strong>
                <ul style="margin: 10px 0; padding-left: 20px; color: #1f2937;">
                  <li>Contact the dormitory administration for clarification</li>
                  <li>Address the concerns mentioned in the denial reason</li>
                  <li>You may resubmit a new visitor request if applicable</li>
                  <li>Ensure all required information is accurate</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automated message from DormGuard Visitor Management System.</p>
              <p>Please do not reply to this email.</p>
              <p>For assistance, contact the dormitory administration.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Denial email sent to ${tenant.email}`);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVisitorApprovalEmail,
  sendVisitorDenialEmail
};
