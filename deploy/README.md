# Deployment Notes

The frontend is deployed as a static Vite build to `/var/www/go-polina`.

## GitHub Actions Secrets

Set these repository secrets before enabling the workflow:

- `SSH_HOST`: server IP or hostname
- `SSH_USER`: SSH user with write access to the deploy path
- `SSH_PRIVATE_KEY`: private key used by GitHub Actions
- `DEPLOY_PATH`: deploy base path on the server, for example `/var/www/go-polina`
- `VITE_SUPABASE_URL`: production Supabase URL, for example `https://api.vozclub.ru`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: production publishable key from self-hosted Supabase
- `VITE_SUPABASE_PROJECT_ID`: optional compatibility value if still used by your CI setup

## Server Layout

The workflow expects this layout:

- `/var/www/go-polina/releases`: timestamped releases
- `/var/www/go-polina/current`: symlink to the active `dist` directory

## Notes

- The workflow deploys only the frontend.
- Self-hosted Supabase on the server is managed separately and is not redeployed by this workflow.
