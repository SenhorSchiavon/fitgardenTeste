# Deploy pelo GitHub Actions

## Acesso pela rede Tailscale

Os workflows conectam o runner ao Tailscale antes do SSH usando
tailscale/github-action@v4. Cadastre também TS_OAUTH_CLIENT_ID e TS_OAUTH_SECRET
em cada repositório. O cliente OAuth deve ter as permissões de Auth Keys Write
e Devices Core Write e estar associado a tag:fitgarden-ci.
Defina essa tag na política do Tailscale e permita acesso dela ao IP do servidor
na porta TCP do SSH, preservando as regras existentes. Use o IP Tailscale do
servidor em DEPLOY_HOST. O acesso SSH continua autenticado pela chave de deploy.
Essas alterações precisam ser publicadas para ativar a etapa Tailscale.

A cada push na main, .github/workflows/deploy.yml acessa o servidor por SSH e
executa npm run deploy no checkout do frontend.

Configure os secrets DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY,
DEPLOY_KNOWN_HOSTS e DEPLOY_PATH. DEPLOY_PORT é opcional (padrão 22).
DEPLOY_PATH deve ser o caminho absoluto do frontend. Valide a chave pública
do servidor antes de preencher known_hosts. Não coloque chaves no código.

O checkout remoto deve estar na main, com upstream e acesso de leitura ao
GitHub. O usuário precisa ter bash, flock, npm, Node e PM2 no ambiente de login.
O script instala dependências, compila e reinicia o processo PM2 2; confira o
ID antes de ativar. O .env permanece no servidor.

Publique o workflow e a alteração de package.json na main e acompanhe a
execução na aba Actions. Também é possível iniciar manualmente.
