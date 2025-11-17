export interface Message {
  id: string;
  from: string;
  subject: string;
  date: string;
}

export interface Attachment {
  id:string;
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

// FIX: Add missing LinkPreview interface.
export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image?: string;
  sitename: string;
}
