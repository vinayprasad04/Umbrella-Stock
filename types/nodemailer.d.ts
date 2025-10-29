declare module 'nodemailer' {
  import { Readable } from 'stream';

  namespace nodemailer {
    interface TransportOptions {
      service?: string;
      host?: string;
      port?: number;
      secure?: boolean;
      auth?: {
        user: string;
        pass: string;
      };
      [key: string]: any;
    }

    interface SendMailOptions {
      from?: string;
      to: string;
      subject: string;
      text?: string;
      html?: string;
      attachments?: Array<{
        filename?: string;
        content?: string | Buffer | Readable;
        path?: string;
        [key: string]: any;
      }>;
      [key: string]: any;
    }

    interface SentMessageInfo {
      messageId: string;
      envelope: any;
      accepted: string[];
      rejected: string[];
      pending: string[];
      response: string;
      [key: string]: any;
    }

    interface Transporter {
      sendMail(mailOptions: SendMailOptions): Promise<SentMessageInfo>;
      verify(): Promise<true>;
      close(): void;
    }

    function createTransport(options: TransportOptions): Transporter;
  }

  export = nodemailer;
}
