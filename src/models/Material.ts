export interface MaterialFolder { conteudo: string; quantidade?: number }
export interface Material { conteudo: string; nome: string; tamanho?: number; tipo?: string; atualizadoEm?: string }
export type MaterialFile = { uri: string; name: string; mimeType?: string | null; size?: number | null; file?: unknown };
