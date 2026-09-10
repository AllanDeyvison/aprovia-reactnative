export interface Chat {
  chat_id: string;
  title: string;
  updated_at: string;
  // Alguns backends já incluem o modelo no resumo do chat. Mantemos opcional
  // para chats antigos e não inferimos tutor pelo título.
  model?: string | null;
  tutor?: string | null;
  tutor_model?: string | null;
  model_name?: string | null;
}
