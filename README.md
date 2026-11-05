# NEXO Campus — Smart Campus SENAI Taguatinga

Protótipo de assistente para estudantes, criado para o Desafio 1: Smart Campus SENAI (Taguatinga), em 05/11/2026.

## O diferencial

O **NEXO Radar** conecta agenda, tempo disponível, interesses e oportunidades para sugerir **a próxima ação útil**. O estudante não recebe somente uma lista de avisos; recebe orientação contextual.

## Entregáveis

- dist/index.html: landing page de apresentação do produto.
- dist/campus.html: mockup funcional do aplicativo web.
- dist/campus.js: regras do Radar, agenda, vagas, comunicados, mapa e assistente contextual.
- dist/style.css e dist/campus.css: design responsivo e componentes.
- PITCH.md: roteiro de apresentação de três minutos.

## Como demonstrar

1. Abra a landing e clique em **Experimentar a NEXO**.
2. O tour guiado abre o aplicativo e conduz os recursos em cinco passos.
3. No **Radar**, observe a janela livre às 10h20 e a atividade sugerida que cabe antes da aula das 11h.
4. Mude o horário simulado para 10h50: a prioridade vira chegar à próxima aula.
5. Consulte o mapa e pergunte ao assistente sobre vagas, aulas ou tempo livre.

## Confiabilidade e honestidade

- Todas as informações de cursos, horários, vagas, locais e comunicados são **fictícias** e rotuladas como demonstração.
- O mapa é **esquemático** e não representa a planta do SENAI Taguatinga.
- O assistente **não usa IA generativa externa** nesta versão. Ele responde com regras determinísticas sobre os dados do próprio protótipo.
- Nenhum dado é enviado para servidor. O salvamento local de oportunidades é feito no armazenamento do navegador.
- Não existe integração com sistemas oficiais do SENAI, nem notificações push reais.
- Para implantação real: validação e autorização da unidade, dados confiáveis via APIs ou painéis administrativos, LGPD, controles de acesso, notificações autorizadas e testes de usabilidade com estudantes.

## Técnicas

HTML sem build, CSS responsivo, JavaScript local e SVG. Funciona sem API key, conta ou dependências em tempo de execução.

## Identidade visual

Paleta inspirada no Manual de Marcas 2024 do SENAI: azul institucional #1A4B9F e laranja #EF5E31, com branco, azul-marinho e tons claros de apoio. A NEXO é uma proposta independente de hackathon; não usa a marca oficial do SENAI como logotipo próprio.
