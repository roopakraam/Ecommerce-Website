export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailNotificationProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}

export interface WhatsAppMessage {
  /** Destination phone in E.164 format, e.g. +9198XXXXXXXX */
  to: string;
  body: string;
}

export interface WhatsAppNotificationProvider {
  readonly name: string;
  send(message: WhatsAppMessage): Promise<void>;
}
