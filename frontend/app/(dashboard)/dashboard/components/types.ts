export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments: any[];
};

export type SelectedDoc = {
  id: string;
  name: string;
  size: number;
  type: string;
};
