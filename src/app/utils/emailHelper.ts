import * as fs from 'fs';
import nodemailer from 'nodemailer';
import * as path from 'path';
import config from '../config';
const Util = require('util');
const ReadFile = Util.promisify(fs.readFile);
const Handlebars = require('handlebars');

const sendEmail = async (
   to: string,
   html: string,
   subject: string,
   replyTo?: string,
   fromName?: string,
   attachment?: { filename: string, content: Buffer, encoding: string }
) => {
   try {
      const transporter = nodemailer.createTransport({
         host: "smtp.gmail.com",
         port: 587,
         secure: false,
         auth: {
            user: config.sender_email,
            pass: config.sender_app_password,
         },
         tls: {
            rejectUnauthorized: false
         }
      });

      // Email configuration
      const mailOptions: any = {
         from: fromName 
            ? `"${fromName}" <${config.sender_email}>`
            : `"ZOOM IT" <${config.sender_email}>`,
         to: to,
         subject,
         html,
         date: new Date().toLocaleString("en-US", {
            timeZone: "Asia/Dhaka",
            dateStyle: "full",
            timeStyle: "long",
         }),   
      };

      // Add Reply-To header if provided (customer email)
      if (replyTo) {
         mailOptions.replyTo = replyTo;
      }

      if (attachment) {
         mailOptions.attachments = [
            {
               filename: attachment.filename,
               content: attachment.content,
               encoding: attachment.encoding,
            }
         ];
      }

      // Sending the email
      const info = await transporter.sendMail(mailOptions);
  
      return info;
   } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
   }
}

const createEmailContent = async (data: object, templateType: string) => {
   try {
      const templatePath = path.join(
         process.cwd(),
         `/src/templates/${templateType}.template.hbs`
      );
      const content = await ReadFile(templatePath, 'utf8');

      const template = Handlebars.compile(content);

      return template(data);
   } catch (error) { }
};

export const EmailHelper = {
   sendEmail,
   createEmailContent
};
