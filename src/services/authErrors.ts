import axios from "axios";
import { Platform } from "react-native";
export class AuthClientError extends Error {}
export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthClientError) return error.message;
  if (axios.isAxiosError<unknown>(error)) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT")
      return "O servidor demorou para responder. Tente novamente.";
    const status = error.response?.status;
    if (status === 400 || status === 422) return "Confira os dados informados e tente novamente.";
    if (status === 401 || status === 403) return "Usuário ou senha inválidos, ou sessão expirada. Entre novamente.";
    if (status === 409) return "Não foi possível cadastrar. Usuário ou email pode já existir; confira os dados.";
    if (status === 404) return "Recurso não encontrado. Confira o endereço da API.";
    if (status && status >= 500) return "O servidor está com um problema. Tente novamente mais tarde.";
    if (!error.response) return Platform.OS === "web"
      ? "Não foi possível acessar o servidor. Confira a conexão e o endereço da API; o navegador também pode ter bloqueado a requisição por CORS."
      : "Não foi possível acessar o servidor. Confira a conexão e o endereço da API para este dispositivo.";
    return "Não foi possível concluir a solicitação. Tente novamente.";
  }
  return "Não foi possível concluir a operação ou acessar o armazenamento local. Tente novamente.";
}
