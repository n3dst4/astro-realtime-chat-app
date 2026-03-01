# Astro CloudFlare playground app

See `package.json` for useful commands.

Create `.env`:

```env
export D1_TOKEN="get this from cloudflare portal"
export CF_ACCOUNT_ID="get this from cloudflare portal"
```

Create database:

Not sure if these anything doing local? Or will wrangler just make it automatically on first use?

Set up database:

```sh
pnpm run db:migrate
```

Add a new D1 db:

```
npx wrangler d1 create my-database
```
