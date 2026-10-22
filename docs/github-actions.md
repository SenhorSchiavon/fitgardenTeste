# Deploy pelo GitHub Actions

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
