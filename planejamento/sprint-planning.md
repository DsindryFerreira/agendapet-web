# Planejamento da Sprint: AgendaPet Web

## 1. Cabeçalho
* **Nome da Sprint:** Sprint 1 — Painel de Agendamentos Pet
* **Data de Início:** 27/10/2026
* **Data de Término:** 03/11/2026
* **Cliente:** Patinhas & Cia
* **Equipe:** Dsindry Ferreira

## 2. Meta da sprint
Entregar a primeira versão do painel de agendamentos da Patinhas & Cia, permitindo que a atendente cadastre e acompanhe os agendamentos validados do dia de forma responsiva, com suporte a consultas externas e fechamento financeiro executável tanto na web quanto via terminal.

## 3. Backlog estimado

| Ordem | Ticket | História | Pts | Por que nessa ordem |
|---|---|---|---|---|
| 1 | Setup | `chore/setup-projeto` | 1 | Repositório, `.gitignore`, `package.json` e modelo de PR precisam existir antes de qualquer código. |
| 2 | US01 | Estrutura semântica e acessível | 2 | O HTML semântico e o CSS definem a estrutura visual e os IDs que o JavaScript usará para manipular a tela. |
| 3 | US10 | Layout responsivo e identidade visual | 5 | Garante a base visual e a responsividade em celular e tablet antes de injetar os dados dinâmicos. |
| 4 | US02 | Catálogo de serviços | 3 | O catálogo alimenta as opções do formulário; precisa existir previamente. |
| 5 | US03 | Formulário de novo agendamento | 5 | O formulário é o coração do produto e o gerador de dados para as próximas regras de negócio. |
| 6 | US04 | Endereço automático por CEP | 3 | Depende do formulário pronto. Integração externa com APIs, tratando o primeiro grande fator de risco de rede. |
| 7 | US05 | Alerta de feriados | 3 | Também depende do formulário e de chamadas externas de API para bloquear/alertar datas inválidas. |
| 8 | US06 | Agenda do dia | 5 | A listagem e exibição dos agendamentos na tela dependem de o formulário já estar gerando esses dados. |
| 9 | US07 | Regras de negócio e fechamento | 8 | Realiza os cálculos financeiros complexos e regras de validação sobre a lista da agenda do dia. |
| 10 | US08 | Persistência e exportação | 3 | A persistência e salvamento dos dados só fazem sentido com a dinâmica da agenda funcionando por completo. |
| 11 | US09 | Relógio e lembretes | 3 | Funcionalidade de apoio temporal que necessita da estrutura de agendamentos consolidada. |
| 12 | US11 | Projeto Node.js e relatório | 3 | Os scripts de terminal reutilizam as regras de negócio e a estrutura de domínio criadas anteriormente. |
| 13 | US12 | Depuração e relatório de bug | 2 | Etapa de validação final e testes de depuração em cima do script de fechamento gerado na US11. |
| 14 | Docs | `docs/readme` | 1 | Finalização do README, documentações adicionais e retrospectiva com o projeto 100% completo. |

**Total de Pontos da Sprint:** 46 pontos

## 4. Riscos e plano B

| Risco | Plano |
|---|---|
| ViaCEP ou BrasilAPI fora do ar | Tratamento com `try/catch` para exibir mensagens claras de erro por tipo, permitindo preenchimento manual do endereço sem bloquear o agendamento. |
| `localStorage` vazio ou corrompido | Implementação de `try/catch` com valor padrão na inicialização do sistema; itens com dados inválidos são ignorados durante a restauração. |
| Datas com fuso horário (`new Date()` convertendo para UTC) | Mitigar o risco trabalhando estritamente com manipulação de data e hora como strings de texto formatadas (`AAAA-MM-DD` e `HH:MM`). |
| Prazo curto de duas semanas para entrega | Focar no desenvolvimento dos cartões de prioridade Alta primeiro e agrupar os tickets correlacionados no desenvolvimento da mesma branch. |
| Dificuldade com conceitos novos (herança, closure, módulos) | Isolar as regras lógicas e testar a camada de domínio diretamente no Node.js antes de acoplá-la à interface gráfica. |

### Plano de Contingência (O que cortar se faltasse tempo)
Para preservar os requisitos obrigatórios do núcleo do sistema, os seguintes itens seriam removidos nesta ordem em caso de falta de tempo:
1. Funcionalidades extras e bônus (Deploy automático no GitHub Pages, testes opcionais executados via `node --test`).
2. Recurso de download da agenda como arquivo físico (mantendo puramente o fluxo de copiar a estrutura JSON).
3. Escopo secundário da US09 (desativar envio/alertas de lembretes, mantendo apenas a renderização visual do relógio).

## 5. Definição de Pronto para Iniciar

Cada cartão de história de usuário só entra em desenvolvimento se cumprir os seguintes critérios:
- [x] O ticket possui critérios de aceitação claros e bem definidos.
- [x] A branch correspondente segue o padrão de nomenclatura acordado (ex: `feat/USXX-...`).
- [x] O ambiente local está configurado e as dependências necessárias estão instaladas.
- [x] Os riscos técnicos imediatos da tarefa foram mapeados e discutidos.
