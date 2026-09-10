# Parte 0 — estabilização técnica (2026-09-09)

Escopo: dependências, arquivos do template e distribuição do código. Nenhuma tela,
funcionalidade ou fluxo de autenticação foi implementado nesta parte. As alterações
que já existiam no diretório de trabalho foram preservadas.

## Referência e inspeção

Lido `AGENTS.md` e consultada a documentação exigida:
https://docs.expo.dev/versions/v57.0.0/ (SDK 57, React Native 0.86,
React 19.2.3, Node mínimo 22.13.x).

Inspecionados `package.json`, `package-lock.json` (lockfileVersion 3), `app.json`,
`tsconfig.json` e imports estáticos/dinâmicos e require de todos os fontes em `src`.
TypeScript continua com `strict: true`. Manifesto e raiz do lockfile estão sincronizados.

Imports externos encontrados: `react`, `react-native`, `expo-router`,
`react-native-gesture-handler`, `@react-native-async-storage/async-storage`,
`axios`, `expo-secure-store`, `lucide-react-native`.

## Comandos e resultados

No PowerShell deste computador, `npm`/`npx` selecionam scripts `.ps1` bloqueados
pela política local. Foram usados os equivalentes `npm.cmd`/`npx.cmd`, sem alterar
a política de execução. As consultas online inicialmente falharam com EACCES no
sandbox e foram repetidas com acesso autorizado.

| Comando | Inicial | Após correções |
| --- | --- | --- |
| `node --version` | v22.14.0 | compatível |
| `npm.cmd --version` | 11.6.0 | mantido |
| `npx.cmd expo install --check` | 9 pacotes desatualizados | Dependencies are up to date, código 0 |
| `npx.cmd expo-doctor@latest` | 20/21; versões desalinhadas | 21/21, código 0 (doctor 1.20.4) |
| `npx.cmd tsc --noEmit` | passou, código 0 | passou, código 0 |
| `npm.cmd ls react-native-screens` | lock com uma versão | 4.26.2; Router usa a mesma instalação deduplicada |
| `git diff --check` | — | passou |

Executado `npx.cmd expo install --fix`, que atualizou somente patches dentro do
SDK 57: expo 57.0.21, @expo/ui 57.0.17, expo-constants 57.0.17,
expo-font 57.0.3, expo-glass-effect 57.0.2, expo-image 57.0.4,
expo-linking 57.0.9, expo-router 57.0.20 e expo-secure-store 57.0.3.
Algumas faixas já permitiam o patch e foram mantidas pelo instalador; o lockfile
registra a versão resolvida. O instalador adicionou o plugin `expo-image` em
`app.json`. Não foram usados overrides, exclusões do doctor ou instalações forçadas.

`react-native-screens` já estava correto (~4.26.0, resolvido 4.26.2); não foi
alterado manualmente. `expo-constants` já existia e foi atualizado. Nenhum peer
obrigatório adicional foi solicitado pelo doctor.

O npm reportou 14 vulnerabilidades moderadas durante a instalação. Não foi
executado `npm audit fix`: auditoria de segurança transitiva não foi confundida
com alinhamento do SDK e não foram aceitas alterações forçadas.

## Limpeza conservadora e dependências mantidas

Removidos `src/global.css` e 14 imagens sem referências nos fontes, configuração,
scripts ou README: `assets/images/{tutorial-web,expo-logo,expo-badge,
expo-badge-white,react-logo,react-logo@2x,react-logo@3x,logo-glow}.png` e
`assets/images/tabIcons/{home,home@2x,home@3x,explore,explore@2x,explore@3x}.png`.
Ícones e splash referenciados no app.json, inclusive `assets/expo.icon`, foram mantidos.

Dependência sem import direto não significa dependência dispensável:

- Mantidos Expo, constants, linking, screens, safe-area-context, React DOM/web,
  gesture-handler, reanimated/worklets e SVG: infraestrutura, peers ou dependências
  dos componentes usados. Font, splash-screen e system-ui também atendem à
  infraestrutura/configuração, mesmo sem import direto do aplicativo.
- `@expo/ui`, `expo-glass-effect`, `expo-image`, `expo-symbols`, `expo-status-bar`
  e `expo-web-browser` não têm import direto atual. Mantidos conservadoramente
  para integrações opcionais do Router e próximas partes; não há especificação
  suficiente dessas partes para comprovar que sua remoção seja adequada.
- `expo-device`, `expo-speech`, `expo-speech-recognition` e `react-native-marked`
  não têm import atual. Mantidos para possíveis partes de dispositivo, voz e
  renderização de chat; isso é uma decisão conservadora, não prova de uso atual.
- `Avatar.tsx` e `Badge.tsx` não são usados pelas rotas atuais; são componentes do
  aplicativo, não resíduos comprovados do template, e foram preservados.
- `scripts/reset-project.js` é do template, mas permanece referenciado pelo script
  npm e pelo README. Não foi executado nem removido nesta limpeza.

## Git e ZIPs

`.gitignore` agora exclui `.env`, `.env.*` (exceto `.env.example`) e ZIPs.
`node_modules`, `.expo` e `dist` já estavam ignorados. Nenhum desses arquivos ou
diretórios está no índice Git. O `.env` real foi preservado localmente, sem ler
ou registrar seus valores. `.env.example` contém apenas endereços fictícios locais;
ajuste as URLs ao backend real. EXPO_PUBLIC_* nunca deve conter segredos.

Os ZIPs preexistentes no diretório pai foram sanitizados, preservando o restante
de seu conteúdo histórico: `aprovia-reactnative.zip` (53.287 entradas excluídas)
e `aprovia_reactnative_FrontEnd.zip` (51.728 entradas excluídas). Não representam
necessariamente a versão atual dos fontes. A integridade ZIP e as exclusões foram
verificadas após a escrita. Não foram deixadas cópias ZIP com o conteúdo excluído.

Para empacotar o estado atual, execute `python scripts/source-zip.py`. O script
produz `aprovia-reactnative-source.zip`, exclui dependências, caches, build, Git,
ZIPs e arquivos de ambiente reais, não segue links simbólicos e verifica o arquivo
gerado. Inclui `.env.example`. Use esse comando em vez de compactar a pasta inteira:
o `.gitignore` sozinho não controla ZIPs criados por ferramentas externas.

## Verificação de inicialização

`npx.cmd expo export --platform all` passou com código 0: bundles Android
(3.589 módulos), iOS (3.495 módulos), web (3.143 módulos) e 11 rotas estáticas
geradas em `dist`, que permanece ignorado. Não houve erro de resolução de módulos.

`npx.cmd expo start --web --port 8081` iniciou o Metro, com `CI=1` apenas no
processo de verificação. GET da página web retornou HTTP 200. A solicitação do
manifesto com `expo-platform: android` também retornou HTTP 200. No sandbox houve
um aviso ao resolver assets do manifesto; repetido com rede autorizada, o manifesto
incluiu `iconUrl` e o ícone retornou HTTP 200. Todos os caminhos de assets em
`app.json` existem, inclusive os arquivos internos do ícone iOS.

O teste visual do navegador integrado não pôde iniciar: a ferramenta retornou
`missing field sandboxPolicy` antes de conectar. O ADB iniciou e listou zero
dispositivos; `emulator -list-avds` não listou nenhum AVD. Portanto, execução real
Android exige conectar um dispositivo compatível ou configurar um emulador.
Exportação de bundle não equivale a validar a execução de módulos nativos.

Assim, os três critérios automatizados passaram sem exceções. A aceitação de
execução em navegador e dispositivo Android permanece parcial: HTTP, renderização
estática e bundles foram validados, mas não a execução interativa e nativa.
Para completar: iniciar `npm.cmd run web` em navegador e, com dispositivo/AVD
disponível, `npm.cmd run android`. O servidor temporário de verificação foi encerrado.

## Arquivos alterados nesta parte

- `package.json`, `package-lock.json`: instalador oficial do Expo.
- `app.json`: plugin expo-image acrescentado pelo instalador.
- `.gitignore`, `.env.example`: proteção de ambientes e exemplo público.
- `scripts/source-zip.py`: empacotamento filtrado e verificado.
- `DIAGNOSTICO-PARTE-0.md`: este registro.
- `src/global.css` e as 14 imagens enumeradas acima: removidos por falta de uso.
- Dois ZIPs históricos no diretório pai: sanitizados; novo ZIP de fontes no projeto.

`tsconfig.json` e os arquivos de telas, contextos e serviços não foram alterados
nesta parte. As demais diferenças exibidas pelo Git já existiam antes da tarefa.
