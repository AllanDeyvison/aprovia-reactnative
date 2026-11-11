export type ExamStatus = "RASCUNHO" | "APROVADO" | "ARQUIVADO";
export type QuestionType = "multipla_escolha" | "dissertativa" | "desafio_codigo";
export interface ExamOption { id: string; texto: string }
export interface ExamTestCase { entrada: string; saida_esperada: string }
export interface ExamQuestion { id_questao: string; ordem: number; tipo: QuestionType; peso: number; enunciado: string; topico?: string; opcoes?: ExamOption[]; resposta_correta_id?: string; explicacao_gabarito?: string; chave_correcao?: string; limite_caracteres?: number; linguagem_permitida?: string; codigo_inicial?: string; casos_de_teste?: ExamTestCase[] }
export interface Exam { _id: string; titulo: string; status: ExamStatus; contexto: { assunto_materia: string }; configuracoes_teste: { tempo_limite_minutos: number; nota_maxima: number; permite_refazer: boolean }; total_questoes?: number; questoes?: ExamQuestion[]; usada?: boolean }
export interface ExamPayload { titulo: string; status: ExamStatus; contexto: { assunto_materia: string }; configuracoes_teste: { tempo_limite_minutos: number; nota_maxima: number; permite_refazer: boolean }; questoes: ExamQuestion[] }
export interface ExamAnswer { id_questao: string; resposta: string }
export interface ExamSubmission { respostas: ExamAnswer[]; tempo_gasto_segundos: number }
export interface ExamResultData { nota_obtida?: number | null; nota_maxima?: number | null; acertos?: number | null; total_questoes?: number | null; questoes_pendentes_correcao?: string[]; correcao_concluida?: boolean }
export interface ExamResult extends ExamResultData { resultado?: ExamResultData; tentativa?: number | string; prova_id?: string; [key: string]: unknown }
export interface ExamAnswerSummary { usuario_id?: string; tentativa?: number | string; data?: string; nota?: number | null; total_questoes?: number; acertos?: number; pendencias?: number | string[]; [key: string]: unknown }
