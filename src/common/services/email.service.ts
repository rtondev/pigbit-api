import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { passwordResetEmail, verificationEmail } from '../email-templates';

@Injectable()
export class EmailService {
  private transporter: Transporter | null = null;

  constructor(private config: ConfigService) {
    const user = this.config.get<string>('email.user');
    const pass = this.config.get<string>('email.pass');
    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: this.config.get('email.host'),
        port: this.config.get('email.port'),
        secure: false,
        auth: { user, pass },
      });
    }
  }

  async sendVerificationCode(to: string, codigo: string): Promise<void> {
    if (!this.transporter) return;
    const template = verificationEmail(codigo);
    await this.transporter.sendMail({
      from: this.config.get('email.from'),
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  }

  async sendPasswordResetCode(to: string, codigo: string): Promise<void> {
    if (!this.transporter) return;
    const template = passwordResetEmail(codigo);
    await this.transporter.sendMail({
      from: this.config.get('email.from'),
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  }
}
