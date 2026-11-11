import { chatApi } from "./api";
import axios from "axios";
import { DashboardService } from "./DashboardService";
import { AuthClientError } from "./authErrors";
import type { Exam, ExamPayload, ExamQuestion, ExamResult, ExamSubmission, ExamAnswerSummary } from "../models/Exam";

function validate(question: ExamQuestion) {
  if (!question.id_questao.trim() || !question.enunciado.trim() || !Number.isFinite(question.peso) || question.peso <= 0 || !Number.isInteger(question.ordem)) throw new AuthClientError("Cada questão exige ID, enunciado, ordem inteira e peso positivo.");
  if (question.topico && question.topico.length > 80) throw new AuthClientError("O tópico deve ter no máximo 80 caracteres.");
  if (question.tipo === "multipla_escolha") {
    if (!question.opcoes || question.opcoes.length < 2) throw new AuthClientError("Múltipla escolha exige ao menos duas alternativas.");
    const ids = new Set<string>();
    for (const option of question.opcoes) { if (!option.id.trim() || !option.texto.trim()) throw new AuthClientError("Cada alternativa precisa de ID e texto."); if (ids.has(option.id)) throw new AuthClientError("Não use IDs de alternativa duplicados."); ids.add(option.id); }
    if (!question.resposta_correta_id || !ids.has(question.resposta_correta_id)) throw new AuthClientError("Selecione uma alternativa correta existente.");
  }
  if (question.tipo === "dissertativa" && question.limite_caracteres !== undefined && (!Number.isInteger(question.limite_caracteres) || question.limite_caracteres <= 0)) throw new AuthClientError("O limite de caracteres deve ser um inteiro positivo.");
  if (question.tipo === "desafio_codigo" && question.casos_de_teste && question.casos_de_teste.some(test => typeof test.entrada !== "string" || typeof test.saida_esperada !== "string")) throw new AuthClientError("Cada caso de teste precisa de entrada e saída esperada.");
}
export function validateExam(payload: ExamPayload) {
  if (!payload.titulo.trim() || !payload.contexto.assunto_materia.trim()) throw new AuthClientError("Título e assunto são obrigatórios.");
  if (!Number.isInteger(payload.configuracoes_teste.tempo_limite_minutos) || payload.configuracoes_teste.tempo_limite_minutos <= 0 || !Number.isFinite(payload.configuracoes_teste.nota_maxima) || payload.configuracoes_teste.nota_maxima <= 0) throw new AuthClientError("Tempo inteiro e nota máxima devem ser positivos.");
  if (!payload.questoes.length) throw new AuthClientError("Inclua pelo menos uma questão.");
  const ids = new Set<string>();
  for (const question of payload.questoes) { if (ids.has(question.id_questao)) throw new AuthClientError("Não use IDs de questão duplicados."); ids.add(question.id_questao); validate(question); }
}
export const ExamService = {
  async list(assunto?: string, status?: string): Promise<Exam[]> { const response = await chatApi.get<unknown>("/exams", { params: { ...(assunto ? { assunto } : {}), ...(status ? { status } : {}) } }); if (!Array.isArray(response.data)) throw new AuthClientError("A API retornou uma lista de provas em formato inválido."); return response.data as Exam[]; },
  async get(id: string): Promise<Exam> { return (await chatApi.get<Exam>(`/exams/${encodeURIComponent(id)}`)).data; },
  async create(payload: ExamPayload): Promise<Exam> { validateExam(payload); return (await chatApi.post<Exam>("/exams", payload)).data; },
  async update(id: string, payload: ExamPayload): Promise<Exam> { validateExam(payload); return (await chatApi.put<Exam>(`/exams/${encodeURIComponent(id)}`, payload)).data; },
  async remove(id: string): Promise<void> { await chatApi.delete(`/exams/${encodeURIComponent(id)}`); },
  async submit(id: string, payload: ExamSubmission): Promise<ExamResult> { try { const result = (await chatApi.post<ExamResult>(`/exams/${encodeURIComponent(id)}/answers`, payload)).data; DashboardService.invalidate(); return result; } catch (error) { if (axios.isAxiosError(error) && error.response?.status === 409) throw new AuthClientError("Esta prova não permite nova tentativa."); throw error; } },
  async attempts(id: string): Promise<ExamResult[]> { const data = (await chatApi.get<unknown>(`/exams/${encodeURIComponent(id)}/answers`)).data; if (!Array.isArray(data)) throw new AuthClientError("A API retornou as tentativas em formato inválido."); return data as ExamResult[]; },
  async history(): Promise<ExamResult[]> { const data = (await chatApi.get<unknown>("/exams/answers")).data; if (!Array.isArray(data)) throw new AuthClientError("A API retornou o histórico em formato inválido."); return data as ExamResult[]; },
  async allAnswerSummaries(id: string): Promise<ExamAnswerSummary[]> { const data = (await chatApi.get<unknown>(`/exams/${encodeURIComponent(id)}/answers/all`)).data; return Array.isArray(data) ? data as ExamAnswerSummary[] : []; },
};
