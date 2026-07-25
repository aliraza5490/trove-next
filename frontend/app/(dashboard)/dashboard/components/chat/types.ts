export type Attachment = {
  id: string;
  name: string;
  url: string;
  googleUri?: string | null;
  mimeType?: string | null;
  size?: number | null;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  status?: string;
};

export type SelectedDoc = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  googleUri?: string | null;
  content: string;
  isUploading: boolean;
};

export type SuggestedPrompt = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  prompt: string;
  color: string;
};
