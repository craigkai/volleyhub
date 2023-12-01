# Volleyball Tournament Manager

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

## Supabase locally

```bash
    supabase start
    supabase npx supabase link
    npx supabase db pull
```

Should set supabase URL and key to connect to local instance in `.env.development`.
