import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { IEmailService } from './interfaces/IEmailService';

class EmailService implements IEmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT || 587),
      secure: false, // use true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER || 'shijayaalath@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'hphiuruyadeziolj',
      },
    });
  }

  async sendOtp(email: string, otp: string): Promise<boolean> {
    try {
      const mailOptions: SendMailOptions = {
        from: `"My App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Verify Your Account - OTP Code',
        text: `Your OTP is ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
            <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h2 style="color: #007bff; text-align: center;">Email Verification</h2>
              <p style="font-size: 16px; color: #333;">Hi there,</p>
              <p style="font-size: 15px; color: #333;">
                Thank you for registering with <b>My App</b>. Please use the following One-Time Password (OTP) to verify your email address:
              </p>
              
              <div style="text-align: center; margin: 25px 0;">
                <div style="display: inline-block; background: #007bff; color: #fff; font-size: 22px; letter-spacing: 4px; padding: 12px 25px; border-radius: 8px;">
                  ${otp}
                </div>
              </div>

              <p style="font-size: 15px; color: #333;">This OTP will expire in <b>1.30 minutes</b>.</p>
              <p style="font-size: 14px; color: #555;">If you didn’t request this, you can safely ignore this email.</p>

              <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
              <p style="font-size: 13px; color: #999; text-align: center;">
                © ${new Date().getFullYear()} My App. All rights reserved.<br>
                <a href="#" style="color: #007bff; text-decoration: none;">Visit our website</a>
              </p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send OTP email:', error);
      return false;
    }
  }
}

export default new EmailService();
