import axios from "axios";
import { Platform } from "react-native";
export class AuthClientError extends Error {}
export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthClientError) return error.message;
  if (axios.isAxiosError<unknown>(error)) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT")
      return "O servidor demorou para responder. Tente novamente.";
    const status = error.response?.status;
    if (status === 400 || status === 422) {
      const body = error.response?.data as { error?: unknown; detalhes?: unknown } | undefined;
      const details = Array.isArray(body?.detalhes) ? body.detalhes.filter((item): item is string => typeof item === "string").join("\n") : "";
      const message = typeof body?.error === "string" ? body.error : "";
      return details || message || "Confira os dados informados e tente novamente.";
    }
    if (status === 401) return "Usuário ou senha inválidos, ou sessão expirada. Entre novamente.";
    if (status === 403) return "Você não tem permissão para realizar esta ação.";
    if (status === 413) return "A imagem é maior que o limite de 5 MB.";
    if (status === 415) return "Use uma imagem PNG, JPEG ou WebP.";
    if (status === 503) return "O serviço de fotos está indisponível. Tente novamente mais tarde.";
    if (status === 409) return "Há um conflito: esta prova pode não permitir nova tentativa ou a ação já ter sido registrada.";
    if (status === 404) return "A prova não existe mais ou não está disponível.";
    if (status && status >= 500) return "O servidor está com um problema. Tente novamente mais tarde.";
    if (!error.response) return Platform.OS === "web"
      ? "Não foi possível acessar o servidor. Confira a conexão e o endereço da API; o navegador também pode ter bloqueado a requisição por CORS."
      : "Não foi possível acessar o servidor. Confira a conexão e o endereço da API para este dispositivo.";
    return "Não foi possível concluir a solicitação. Tente novamente.";
  }
  return "Não foi possível concluir a operação ou acessar o armazenamento local. Tente novamente.";
}
