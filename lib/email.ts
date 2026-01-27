import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { getBankName } from './site-settings';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    // Try Resend first if API key is available
    if (process.env.RESEND_API_KEY) {
      console.log('Sending email via Resend...');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'onboarding@resend.dev';
      const fromName = process.env.SMTP_FROM_NAME || 'Sterling Capital Bank';

      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html,
        text,
      });

      if (error) {
        console.error('Resend error:', error);
        throw new Error(`Resend email failed: ${error.message}`);
      }

      console.log('Email sent via Resend:', data?.id);
      return { success: true, messageId: data?.id };
    }

    // Fallback to SMTP if Resend is not configured
    console.log('Sending email via SMTP...');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.zoho.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Sterling Capital Bank'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('Email sent via SMTP:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    // Preserve the original error for better debugging
    throw error;
  }
}

export async function sendOTPEmail(email: string, otp: string, fullName: string) {
  const bankName = await getBankName();
  const subject = `Your ${bankName} Login OTP`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .otp-box {
          background: white;
          border: 2px solid #1e3a8a;
          border-radius: 10px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #1e3a8a;
          letter-spacing: 8px;
          margin: 10px 0;
        }
        .warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${bankName}</h1>
          <p>Email Verification</p>
        </div>
        <div class="content">
          <p>Hello ${fullName},</p>
          <p>You recently attempted to log in to your ${bankName} account. To complete the login process, please use the following One-Time Password (OTP):</p>

          <div class="otp-box">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Your OTP Code</p>
            <div class="otp-code">${otp}</div>
            <p style="margin: 0; color: #6b7280; font-size: 12px;">Valid for 10 minutes</p>
          </div>

          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Never share this OTP with anyone</li>
              <li>${bankName} will never ask for your OTP</li>
              <li>This OTP expires in 10 minutes</li>
            </ul>
          </div>

          <p>If you didn't attempt to log in, please ignore this email or contact our support team immediately.</p>

          <p>Best regards,<br>
          <strong>${bankName} Security Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${bankName}. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    ${bankName} - Email Verification

    Hello ${fullName},

    Your OTP code is: ${otp}

    This code is valid for 10 minutes.

    If you didn't request this code, please ignore this email.

    Best regards,
    ${bankName} Security Team
  `;

  return sendEmail({ to: email, subject, html, text });
}

export async function sendTransactionAlertEmail(
  email: string,
  fullName: string,
  transaction: {
    type: 'CREDIT' | 'DEBIT';
    amount: string;
    description: string;
    balance: string;
    transactionId: string;
    date: Date;
    recipientName?: string;
    recipientAccountNumber?: string;
  }
) {
  const bankName = await getBankName();
  const isCredit = transaction.type === 'CREDIT';
  const subject = `${isCredit ? 'Credit' : 'Debit'} Alert - ${bankName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: ${isCredit ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'};
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .alert-box {
          background: white;
          border: 2px solid ${isCredit ? '#059669' : '#dc2626'};
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        }
        .amount {
          font-size: 36px;
          font-weight: bold;
          color: ${isCredit ? '#059669' : '#dc2626'};
          text-align: center;
          margin: 15px 0;
        }
        .transaction-details {
          background: white;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          color: #6b7280;
          font-weight: 500;
        }
        .detail-value {
          color: #111827;
          font-weight: 600;
          text-align: right;
        }
        .balance-box {
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          margin-top: 20px;
        }
        .security-notice {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💳 ${bankName}</h1>
          <p>${isCredit ? '✅ Credit Alert' : '⚠️ Debit Alert'}</p>
        </div>
        <div class="content">
          <p>Dear ${fullName},</p>
          <p>A ${isCredit ? 'credit' : 'debit'} transaction has been ${isCredit ? 'received in' : 'made from'} your account.</p>

          <div class="alert-box">
            <p style="margin: 0; color: #6b7280; text-align: center;">Transaction Amount</p>
            <div class="amount">${isCredit ? '+' : '-'}$${parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>

          <div class="transaction-details">
            <h3 style="margin-top: 0; color: #111827;">Transaction Details</h3>
            <div class="detail-row">
              <span class="detail-label">Transaction Type:</span>
              <span class="detail-value">${isCredit ? 'CREDIT' : 'DEBIT'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Description:</span>
              <span class="detail-value">${transaction.description}</span>
            </div>
            ${transaction.recipientName ? `
            <div class="detail-row">
              <span class="detail-label">${isCredit ? 'Sender Name:' : 'Recipient Name:'}</span>
              <span class="detail-value">${transaction.recipientName}</span>
            </div>
            ` : ''}
            ${transaction.recipientAccountNumber ? `
            <div class="detail-row">
              <span class="detail-label">${isCredit ? 'Sender Account:' : 'Recipient Account:'}</span>
              <span class="detail-value">${transaction.recipientAccountNumber}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Transaction ID:</span>
              <span class="detail-value">${transaction.transactionId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date & Time:</span>
              <span class="detail-value">${transaction.date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>

          <div class="balance-box">
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Available Balance</p>
            <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">$${parseFloat(transaction.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>

          <div class="security-notice">
            <strong>🔒 Security Notice:</strong>
            <p style="margin: 5px 0 0 0;">If you did not authorize this transaction, please contact our support team immediately at support@sterlingcapitalbank.com or call us at 1-800-STERLING.</p>
          </div>

          <p>Thank you for banking with us.</p>
          <p>Best regards,<br>
          <strong>${bankName}</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${bankName}. All rights reserved.</p>
          <p>This is an automated transaction alert. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    ${bankName} - ${isCredit ? 'Credit' : 'Debit'} Alert

    Dear ${fullName},

    A ${isCredit ? 'credit' : 'debit'} transaction has been ${isCredit ? 'received in' : 'made from'} your account.

    Transaction Amount: ${isCredit ? '+' : '-'}$${parseFloat(transaction.amount).toFixed(2)}
    Description: ${transaction.description}
    ${transaction.recipientName ? `${isCredit ? 'Sender' : 'Recipient'} Name: ${transaction.recipientName}` : ''}
    ${transaction.recipientAccountNumber ? `${isCredit ? 'Sender' : 'Recipient'} Account: ${transaction.recipientAccountNumber}` : ''}
    Transaction ID: ${transaction.transactionId}
    Date: ${transaction.date.toLocaleString()}
    Available Balance: $${parseFloat(transaction.balance).toFixed(2)}

    If you did not authorize this transaction, please contact us immediately.

    Best regards,
    ${bankName}
  `;

  return sendEmail({ to: email, subject, html, text });
}
