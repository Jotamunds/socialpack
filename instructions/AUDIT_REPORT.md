# Relatório de consolidação

## Resultado

Os documentos foram reorganizados em um núcleo universal e módulos carregados somente quando aplicáveis.

Na versão 1.3, foram acrescentados harnesses reutilizáveis para Sites e Roblox Studio. Eles guardam contexto permanente do projeto e permitem executar uma tarefa ou uma fila limitada com comandos curtos.

Na versão 1.4, foram acrescentados quatro harnesses combináveis: Backend/Data, Segurança/Autenticação, Release/Deployment e Qualidade. O roteamento agora aceita um harness primário e o menor conjunto aplicável de harnesses adicionais.

## Alterações principais

- `JAP(1).md` foi convertido em `instructions/JAP.md`, agora na versão 1.4.
- O JAP foi reduzido e deixou detalhes operacionais para o perfil FAST e módulos.
- Caminhos e referências foram normalizados.
- Foi criado um `AGENTS.md` curto para inicialização automática.
- `TASK_TEMPLATE.md` passou a aceitar uma lista explícita de módulos.
- Roblox Studio e segurança foram separados para evitar carregar regras de segurança em tarefas puramente visuais.
- Liquid Glass passou de texto conceitual para orientação de implementação, fallback, acessibilidade e desempenho.
- Foi criado um perfil persistente de projeto para stack, arquitetura, comandos, validação e permissões.
- Foi criado um `WORK_ORDER.md` com modos `single` e `batch`, limite por execução e condições obrigatórias de parada.
- Foi criado um `PROJECT_STATE.md` para manter somente estado verificado, problemas, testes pendentes e decisões relevantes.
- Foram criados bootstraps específicos para Sites e Roblox Studio.

## Harnesses

### Sites

- Descoberta técnica controlada durante a inicialização.
- Regras para rotas, componentes, design system, browser, responsividade, acessibilidade e build.
- Categorias de validação separadas para análise estática, testes, build, browser, visual, acessibilidade e integração.
- Deploy, migrações, variáveis, domínio e acesso continuam exigindo autorização explícita.

### Roblox Studio

- Bloqueio obrigatório da fonte autoritativa antes de editar.
- Perfil persistente para experiência, place, Rojo/sincronização, arquitetura e capacidade de Playtest.
- Execução em fila preservando as categorias `AT`, `LI`, `PV` e `MU`.
- Publicação, dados de produção, monetização e configuração ao vivo continuam desativados por padrão.

### Backend, APIs e dados

- Perfil para runtime, contratos, schema, migrações, filas, cache, ambientes e comandos.
- Separação entre gerar e aplicar uma migração.
- Operações locais, compartilhadas e de produção possuem permissões independentes.
- Validação distingue unidade, contrato, integração, banco e jobs.

### Segurança e autenticação

- Perfil para identidade, sessão, autorização, segredos, dados sensíveis e alvos autorizados.
- Exige evidência dos caminhos permitidos e negados quando aplicável.
- Não autoriza testes ofensivos externos nem alterações de credenciais ou políticas de produção.
- Impede alegações genéricas de que um sistema está seguro após validação limitada.

### Release e deployment

- Perfil para branch, CI, versão, artefato, ambientes, health checks e rollback.
- Commit, push, tag, release, deploy, configuração, migração e rollback são permissões separadas.
- Produção exige permissão persistente e tarefa ativa nomeando ação e destino.
- Um job iniciado não pode ser relatado como deployment concluído.

### Qualidade, acessibilidade e performance

- Seleção de validação baseada no risco da mudança, sem executar toda a suíte por cerimônia.
- Evidências separadas para estático, unidade, integração, E2E, browser, visual, acessibilidade e performance.
- Snapshots, baselines, budgets, testes de carga e dados compartilhados ficam protegidos por permissões próprias.
- Não permite declarar conformidade, compatibilidade ou ganho de performance sem evidência proporcional.

## Composição de harnesses

- Cada projeto mantém apenas um conjunto raiz de `AGENTS.md`, `PROJECT_PROFILE.md`, `WORK_ORDER.md` e `PROJECT_STATE.md`.
- `primary_harness` define o domínio principal.
- `additional_harnesses` lista somente domínios realmente usados.
- Estar listado não expande escopo nem concede ações externas.

## Correções de coerência

- Unificação dos estados `DONE`, `PARTIAL`, `FAILED` e `BLOCKED`.
- Validações passaram a exigir método, status e evidência.
- Mantida a separação obrigatória entre teste automatizado, Luau interno, Playtest visual real e teste manual do usuário.
- Removidas instruções que incentivavam auditorias gerais em correções localizadas.
- Commit e push agora dependem de autorização separada.

## Correções técnicas relevantes

- Segurança Roblox deixou de tratar `StreamingEnabled` como garantia contra wallhack.
- Network ownership deixou de ser descrito como proteção suficiente por si só.
- `ProcessReceipt` passou a exigir concessão idempotente e persistência atômica.
- `BindToClose` deixou de usar espera fixa como evidência de salvamento concluído.
- Controles de abuso de Remotes deixaram de exigir um único tipo de cooldown para todos os casos.
- Liquid Glass deixou de prometer custo zero de CPU ou refração física garantida no Roblox.
- Foram adicionados fallbacks de transparência, movimento e compatibilidade.

## Skills Apple

O novo arquivo continha 86 skills Apple. Foram selecionadas 20 para o pacote compacto.

Foram priorizados Swift, SwiftUI, arquitetura, concorrência, testes, dados, networking, autenticação, criptografia, acessibilidade, localização, desempenho visual, Liquid Glass e preparação para revisão da App Store.

Skills de frameworks específicos foram mantidas fora do pacote para evitar contexto excessivo. Duas skills gerais de diagnóstico/simulador também não foram selecionadas porque continham comandos amplos de limpeza destrutiva incompatíveis com o perfil conservador do JAP.

O ZIP de origem possuía entradas de pasta malformadas. A estrutura foi normalizada durante a cópia sem alterar o conteúdo dos arquivos selecionados. As pastas `evals/` foram omitidas por não serem necessárias durante a execução das skills.

## Escopo preservado

Os arquivos originais enviados não foram sobrescritos. O resultado consolidado foi criado como um pacote separado.
