export interface Message {
  id: string;
  from: string;
  subject: string;
  date: string;
}

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
}

export interface MessageDetails extends Message {
  attachments: Attachment[];
  body: string;
  textBody: string;
  htmlBody: string;
}
