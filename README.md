# AprovIA — Expo / React Native

Aplicativo AprovIA migrado do frontend Vite para Expo SDK 57, React Native 0.86 e Expo Router. O Vite é referência de regras, conteúdo e identidade; a interface móvel/web foi reimplementada com componentes React Native.

## Funcionalidades

- login, cadastro, restauração de sessão e logout;
- rotas autenticadas e layout responsivo com sidebar/menu móvel;
- chat novo e existente, streaming quando suportado e fallback HTTP completo;
- histórico na sidebar, deep link, seleção e exclusão;
- sincronização do tutor por chat (`llama3` = Inglês, `qwen2-math` = Matemática);
- Markdown seguro nas mensagens, sem renderização de HTML arbitrário;
- TTS das respostas e ditado por voz;
- perfil com atualização e exclusão de conta;
- ajuda/FAQ, tema claro/escuro e assets oficiais AprovIA.

## Ambiente

Use Node 22 e `npm ci`. Copie `.env.example` para `.env` e configure somente endereços públicos das APIs:

```env
EXPO_PUBLIC_AUTH_API=http://localhost:8090
EXPO_PUBLIC_API_URL=http://localhost:8000
```

No emulador Android, use `10.0.2.2` no lugar de `localhost`. Em aparelho físico, use o IPv4 da máquina na mesma rede e libere as portas no firewall/backend. Nunca coloque senha, token ou segredo em `EXPO_PUBLIC_*`.

## Executar

```bash
npm ci
npx expo start --clear
```

Web:

```bash
npm run web
```

Android com recursos nativos de reconhecimento de voz:

```bash
npx expo run:android
```

O pacote `expo-speech-recognition` usa config plugin e requer Development Build/prebuild para os módulos nativos. O chat digitado e o TTS continuam disponíveis quando o reconhecimento não estiver disponível. No Web, reconhecimento de voz depende do suporte do navegador e é detectado em runtime.

## Contratos preservados

- `POST /user/login`
- `POST /user/signup`
- `PUT /user/update`
- `DELETE /user/{id}`
- `GET /chats`
- `GET /chats/{chatId}`
- `POST /chats/new` com `{ message, model }`
- `POST /chats/{chatId}/add` com `{ message, model }`
- `DELETE /chats/{chatId}/delete`

As rotas de chat enviam `Authorization: Bearer <JWT>` e usam o claim `sub` como usuário.

Os IDs internos de tutor não devem ser renomeados: `llama3` e `qwen2-math`.

## Verificações

```bash
npm run typecheck
npm test
npm run security:check
npx expo install --check
npx expo-doctor@latest
npx expo export --platform web
```

O teste automatizado cobre validações críticas e resolução do modelo real do chat. Os fluxos com backend real (login, atualização/exclusão, chat e histórico) devem ser executados com as APIs acessíveis; não há mocks de produção.

## Checklist manual mínimo

1. Login válido/inválido, cadastro e manter conectado.
2. Novo chat de Matemática e Inglês; confirme o `model` recebido pelo backend.
3. Alterne repetidamente entre chats dos dois tutores e confirme layout/modelo sincronizados.
4. Teste histórico, deep link e exclusão com falha/sucesso.
5. Teste Markdown, links, código, listas e resposta longa.
6. Teste TTS e ditado; o ditado deve apenas preencher o input.
7. Edite perfil e cancele/conclua exclusão de conta.
8. Teste Web largo/estreito, Android, teclado, tema claro/escuro e botão Voltar.

## Segurança e empacotamento

`.env`, `node_modules`, `.expo`, `dist`, `android`, `ios` e ZIPs são ignorados. O app persiste somente perfil público mínimo e token quando “manter conectado” está ativo; senha não é persistida. Não use `npm install --force`, `--legacy-peer-deps` nem `npm audit fix --force`.
