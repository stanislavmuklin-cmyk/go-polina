# Deployment Notes

This project is deployed as a static Vite build behind Nginx.

## GitHub Actions secrets

Add these repository secrets before enabling the workflow:

- `SSH_HOST`: server IP or hostname
- `SSH_USER`: SSH username
- `SSH_PRIVATE_KEY`: private key used by GitHub Actions
- `DEPLOY_PATH`: base deploy directory on the server, for example `/var/www/go-polina`
- `VITE_SUPABASE_URL`: production Supabase URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: production Supabase publishable key
- `VITE_SUPABASE_PROJECT_ID`: production Supabase project ID

## Server layout

The workflow expects this layout:

- `/var/www/go-polina/releases`: timestamped releases
- `/var/www/go-polina/current`: symlink to the active `dist` directory

## Nginx

Use `deploy/nginx/go-polina.conf.example` as the base site config.
Replace `server_name _;` with the real domain when DNS is ready.
