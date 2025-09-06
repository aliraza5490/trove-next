export interface IFile {
  file_name: string;
  user_id: string; // UUID
  updated_at: string; // ISO 8601 timestamp
  file_path: string;
  id: string; // UUID
  message_id: string | null;
  file_size: number; // bytes
  created_at: string; // ISO 8601 timestamp
}
