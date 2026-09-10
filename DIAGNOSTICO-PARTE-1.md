# Parte 1 — autenticação implementada e validada no web

Retomada em 2026-09-09. A indisponibilidade registrada na tentativa anterior
(ECONNREFUSED em localhost:8090) foi resolvida. Backend real acessível nesta execução.
Escopo limitado à autenticação; nenhum fluxo de chat foi implementado.

## Contrato confirmado no código e em respostas reais

Backend: `../manager_back-main/src/main/java/com/manager`.
Lidos AGENTS.md, fontes atuais, UserController, UserService, User/UserLogin,
JwtAuthFilter e BasicSecurityConfig antes das alterações.

- POST /user/login: JSON `{ username, password }`. Sucesso 200 com
  id, username, name, lastname, email, birthday, picture, token e password vazio.
  O token da resposta já tem prefixo `Bearer `. O cliente normaliza o valor
  em memória e aplica exatamente um prefixo no interceptor.
- POST /user/signup: username, password, name, lastname, email, birthday
  (`YYYY-MM-DD`), picture opcional. Sucesso 200 com User, **sem token**.
  A entidade retornada contém password/hash: o cliente descarta esse campo.
  Duplicidade retornou 409 sem corpo; o backend também converte outras exceções
  de cadastro em 409, portanto a mensagem não afirma que sempre é duplicidade.
- GET /user/{id}: usado para confirmar a sessão lembrada no reinício.
  Cabeçalho `Authorization: Bearer <token>` aceito pelo backend.
- PUT /user/update: requer o objeto completo, incluindo id e password;
  DTO substitui o incorreto Partial<User>. DELETE /user/{id} confirmado.
- Não há userType no modelo deste backend. Removida a chamada não usada a
  PUT /user/type, que não existe no controller inspecionado.

## Evidências antes de alterar a interface

Métodos executados com Axios contra a URL do .env. Senhas, tokens, hashes,
dados pessoais e trace foram omitidos dos registros.

| Método/URL | Status | Corpo sanitizado/observação |
| --- | --- | --- |
| POST http://localhost:8090/user/login com JSON vazio | 403 | campos timestamp, status, error, trace, message, path; valores omitidos |
| POST http://localhost:8090/user/signup com JSON vazio | 409 | vazio |
| POST http://localhost:8090/user/signup válido | 200 | id=352; campos id, username, email, name, lastname, password=[REDACTED], birthday, picture |
| POST http://localhost:8090/user/login válido | 200 | id=352; campos de perfil, token=[REDACTED], password=[REDACTED] |
| POST http://localhost:8090/user/login senha inválida | 401 | campos de erro; valores/trace omitidos |
| POST http://localhost:8090/user/signup duplicado | 409 | vazio |
| GET http://localhost:8090/user/352 com Bearer | 200 | perfil; password/hash descartado |
| OPTIONS http://localhost:8090/user/login | 200 | vazio; origem http://localhost:8081 aceita |
| DELETE http://localhost:8090/user/352 | 200 | vazio; conta temporária removida |

Script repetível: `node scripts/check-auth-backend.cjs`, saída 0.
A conta de teste é criada com senha aleatória em memória e removida ao final;
o script não usa mocks nem grava credenciais.

## Comportamento implementado

- Perfil de sessão contém somente id, username, name e picture. Token separado,
  nunca incluído em user; password não faz parte dos DTOs públicos.
- SecureStore é chamado somente no Android/iOS, com chave válida
  `aprovia.session.token.v1`. Web usa AsyncStorage para o token. Perfil público
  mínimo usa AsyncStorage. Dados legados `@aprovia_user`/`@aprovia_token`
  são descartados, não usados para restaurar sessão.
- Marcado: persiste perfil/token e confirma o token com GET /user/{id} no reinício.
  Desmarcado: limpa persistência anterior e mantém token/perfil só em memória.
- Logout limpa memória e tenta remover todos os registros locais, inclusive
  legados. Falhas de armazenamento têm mensagem de erro na interface.
- Login/signup não enviam credenciais antigas no Authorization.
  Demais chamadas de autenticação usam somente o interceptor central.
- AxiosError é preservado pelos serviços; mensagens tipadas cobrem timeout,
  rede/CORS possível, 400/422, 401/403, 404, 409 e 5xx. Corpo/trace do servidor
  não é exibido. O navegador não distingue CORS de falhas de rede via Axios:
  a mensagem informa essa possibilidade, sem atribuir causa não comprovada.
- Cadastro confirma perfil real e encaminha ao login com mensagem de sucesso,
  sem definir usuário autenticado. Login válido é redirecionado pelo layout.
- Layouts aguardam restauração, protegem (app) e excluem usuários autenticados
  de (auth). Indicador de restauração é separado de carregamento de formulário,
  evitando desmontar as rotas por uma solicitação de login/cadastro.
- Visual preservado; adicionados erros/sucesso, estados de carregamento e
  semântica acessível nos campos, botões e checkbox.
- Variável de autenticação ausente/inválida gera mensagem no formulário em vez
  de erro fatal na importação. Nenhum IP pessoal foi codificado.

## Testes no Chrome com a aplicação real

`scripts/check-auth-web.cjs` executou o aplicativo Expo no Chrome headless com
backend real, sem interceptar respostas ou criar sessões falsas. Saída 0.
Conta temporária id=353 removida por DELETE ao final.

| Cenário | Resultado |
| --- | --- |
| Abrir /home sem sessão | redirecionado a /login |
| Cadastro válido pela UI | POST 200; mensagem no login; nenhum usuário persistido |
| Cadastro duplicado pela UI | POST 409; erro visível |
| Senha inválida pela UI | POST 401; erro visível |
| Login válido desmarcado | POST 200; /home; sem token/perfil no armazenamento |
| Reinício da página após login desmarcado | exige novo login |
| Login marcado e reinício | POST 200; restaura /home após GET /user/353 200 |
| Dados persistidos | somente id/name/picture/username no perfil; token separado; sem senha/legados |
| Acessar /login e /register autenticado | redirecionados a /home |
| Logout e novo acesso a /home | dados removidos; redireciona ao login |
| Backend em URL errada | erro de conexão real mostrado no formulário |

O teste de URL errada usou outra instância do Expo (http://localhost:8082),
com EXPO_PUBLIC_AUTH_API=http://127.0.0.1:8091 somente no processo. Não alterou
o .env real nem desligou o backend do usuário.
A instância principal usou http://localhost:8081 e API http://localhost:8090.

Capturas inspecionadas: `.expo/auth-login-verified.png` e
`.expo/auth-network-error-verified.png`. A skill de navegador integrado foi
tentada, mas sua ferramenta falhou antes da conexão (`missing field sandboxPolicy`).
O teste alternativo usou Chrome separado. A primeira execução excedeu o limite
de compilação inicial; a repetição com limite maior passou.

Ferramenta temporária: Playwright instalado em `.expo/auth-test-tools`,
fora das dependências do aplicativo e excluído dos ZIPs/Git. Para repetir:

```powershell
npm.cmd install --prefix .expo/auth-test-tools --no-save --package-lock=false playwright
# Em outro terminal, iniciar o Expo:
npm.cmd run web
# Chrome instalado:
node scripts/check-auth-web.cjs
```

Para incluir URL errada, iniciar outro Expo na porta 8082 com a variável acima
e executar o teste com AUTH_TEST_WRONG_URL=http://localhost:8082.
Os scripts nunca imprimem o conteúdo das credenciais.

## Verificações técnicas e limite Android

- `npx.cmd tsc --noEmit`: passou, saída 0.
- `npx.cmd expo-doctor@latest`: 21/21 checks, saída 0.
- `npx.cmd expo install --check`: Dependencies are up to date, saída 0.
- `git diff --check`: passou. Avisos de LF/CRLF são do Git no Windows.
- Consultas online falharam com EACCES no sandbox e passaram após autorização.
- `npx.cmd expo export --platform android --output-dir .expo/auth-android-export`:
  passou, saída 0; 3.592 módulos, bundle Hermes de 6 MB e 27 assets.

ADB retornou zero dispositivos; emulator -list-avds não retornou AVD.
**Execução Android não validada**: bundle não substitui execução nativa nem
testa SecureStore em aparelho. Nenhum endereço Android foi efetivamente testado.
Configuração documentada: emulador http://10.0.2.2:8090; aparelho físico
http://<IPv4-da-maquina>:8090. Web validado em http://localhost:8090.
Também não foram induzidos timeout, 400 ou 5xx reais: existem os tratamentos,
mas os cenários reais de erro testados foram 401, 409 e conexão recusada.

## Arquivos alterados nesta parte

- `.env.example`, `README.md`, `DIAGNOSTICO-PARTE-1.md`.
- `src/models/User.ts`, `src/models/UserLogin.ts`.
- `src/services/api.ts`, `AuthService.ts`, `StorageService.ts`;
  novos `authErrors.ts` e `sessionToken.ts`.
- `src/contexts/AuthContext.tsx`.
- `src/app/(auth)/login.tsx`, `register.tsx`, `_layout.tsx`;
  `src/app/(app)/_layout.tsx`, `home.tsx`; `src/app/index.tsx`.
- `src/components/ui/Input.tsx`, `Button.tsx`;
  `src/utils/ValidationService.ts`.
- Novos `scripts/check-auth-backend.cjs` e `scripts/check-auth-web.cjs`.

Package.json, lockfile, SDK, app.json, tsconfig e backend não foram alterados
nesta retomada. Diferenças anteriores da Parte 0 e do usuário foram preservadas.
Chat, suas rotas e seus contratos ficam fora desta parte.

Os dois servidores temporários de teste (8081/8082) foram encerrados ao final.
O backend real do usuário permaneceu em execução.
