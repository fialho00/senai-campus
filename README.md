# Senai Campus — Smart Campus SENAI Taguatinga

Protótipo de assistente para estudantes, criado para o Desafio 1: Smart Campus SENAI (Taguatinga), em 05/11/2026.

## O diferencial

O **Radar do Campus** conecta agenda, tempo disponível, interesses e oportunidades para sugerir **a próxima ação útil**. O estudante não recebe somente uma lista de avisos; recebe orientação contextual.

## Entregáveis

- dist/index.html: landing page de apresentação do produto.
- dist/campus.html: mockup funcional do aplicativo web.
- dist/campus.js: regras do Radar, agenda, vagas, comunicados, mapa e assistente contextual.
- dist/login.html: tela de acesso institucional, com demonstração pública separada.
- dist/theme.js e dist/theme.css: modo escuro/claro com preferência persistida neste navegador.
- worker/index.js: backend seguro para Gemini e OAuth Google Workspace, ativável por variáveis de ambiente.
- PITCH.md: roteiro de apresentação de três minutos.

## Como demonstrar

1. Abra a landing e clique em **Explorar o Senai Campus**.
2. O tour guiado abre o aplicativo e conduz os recursos em cinco passos.
3. No **Radar**, observe a janela livre às 10h20 e a atividade sugerida que cabe antes da aula das 11h.
4. Mude o horário simulado para 10h50: a prioridade vira chegar à próxima aula.
5. Consulte o mapa, teste o modo escuro e pergunte à **SenAI** sobre vagas, aulas ou tempo livre.
6. Acesse **Área SENAI** para mostrar a tela de login institucional preparada (a integração precisa de credenciais).

## Confiabilidade e honestidade

- Todas as informações de cursos, horários, vagas, locais e comunicados são **fictícias** e rotuladas como demonstração.
- O mapa interativo é **esquemático** e não representa a planta do SENAI Taguatinga. Há também uma planta real **do CEUNI/SENAI Blumenau (SC)**, identificada como referência, com link ao PDI oficial.
- A SenAI usa **respostas demonstrativas** enquanto não houver uma chave Gemini configurada no ambiente do servidor. Após a configuração, o frontend envia a mensagem e um contexto **simulado** à API do Senai Campus, que chama a API Gemini no servidor.
- Não há dados acadêmicos pessoais reais no protótipo. O salvamento local de oportunidades e tema utiliza o armazenamento do navegador.
- O login real Google Workspace só é habilitado com credenciais OAuth e domínio institucional aprovados. Acesso por e-mail/senha não existe. Acesso público ao protótipo permanece disponível.
- Não existe integração com sistemas oficiais do SENAI, nem notificações push reais.
- Para implantação real: validação e autorização da unidade, dados confiáveis via APIs ou painéis administrativos, LGPD, controles de acesso, notificações autorizadas e testes de usabilidade com estudantes.

## Técnicas

HTML, CSS responsivo, JavaScript local e um **Cloudflare Worker** simples para servir os arquivos e executar o backend (sem dependências externas de build). O site continua demonstrável sem chave ou conta, mas **não simula autenticação ou respostas Gemini como se estivessem ativas**.

## Como ativar Gemini e login institucional

Configure **somente no gerenciador de segredos do Site** (nunca no HTML, JavaScript público, Git ou URL):

- `GEMINI_API_KEY`: chave Google AI Studio com cota definida. O backend usa por padrão o modelo `gemini-3.8-flash` via `generateContent`, limite de saída 700 tokens e proteção básica de frequência por instância.
- `GEMINI_MODEL` (opcional): identificador de modelo de texto alternativo compatível com o payload de geração.
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`: credenciais OAuth para aplicativo Web no Google Cloud do responsável.
- `GOOGLE_ALLOWED_HD`: um ou mais domínios Google Workspace **confirmados com o SENAI** (separados por vírgulas). Não supor a partir do sufixo de e-mail; o backend valida o `hd` assinado pelo Google.
- `AUTH_SESSION_SECRET`: segredo aleatório de ao menos 32 caracteres, usado para assinar o cookie de sessão.

No aplicativo OAuth, registre como URI de redirecionamento:
`https://senai-campus-2026.weedybull3.chatgpt.site/auth/google/callback`

O login implementa `state`, `nonce`, validação RS256/JWKS, verificação de `iss`, `aud`, `exp`, `email_verified` e `hd`, e cookie HttpOnly/Secure/SameSite. **Exige credenciais, consentimento e possível liberação pelo administrador Google Workspace da instituição**. Antes disso, a tela mostra claramente que a função está indisponível.

Para publicar, execute `node scripts/build-worker.mjs` e depois empacote o `dist/server/index.js` e `.openai/hosting.json` pelo fluxo Sites. Para validar o adaptador localmente, execute `node --test tests/worker.test.mjs`.

**Atenção:** o limite em memória é apenas uma proteção inicial de demonstração. Para produção, usar rate limiting compartilhado na borda, monitoramento e proteção de custos.

## Identidade visual

Paleta inspirada no Manual de Marcas 2024 do SENAI: azul institucional #1A4B9F e laranja #EF5E31, com branco, azul-marinho e tons claros de apoio. **Senai Campus** é o nome do produto independente, e **SenAI** é o apelido do assistente experimental. A IA institucional oficial do SENAI chama-se **Nai** (`nai.senai.br`); não há afiliação ou integração com ela.
