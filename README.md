# KNR MOVIEES

KNR MOVIEES is a MongoDB-backed movie catalog website with an admin panel and Telegram bot delivery flow.

Use this only for movies or files you own, control, or are licensed to distribute.

## What It Includes

- Public movie website with featured rows, search, memberships, and OMDb details
- Admin panel for catalog, collections, branding, memberships, and backups
- Telegram bot deep links for movies that have a licensed download URL configured
- Telegram bot search: users can send a movie title to the bot and get matching results
- Optional LinkShortify routing for free-plan member links

## How The Bot Flow Works

1. Add a movie in the admin panel.
2. Enter a `Licensed Download URL` for that movie.
3. Set your `Telegram Bot Username` in site settings.
4. The public site will open `https://t.me/<your-bot>?start=movie_<movie-id>` for that movie.
5. The bot replies with the movie details and a button that opens your licensed file link.

The public website does not expose the raw download URL in its bootstrap payload.

## Environment Variables

Copy `.env.example` to `.env` and fill in your real values.

Required:

- `MONGODB_URI`
- `SESSION_SECRET`

Optional:

- `PORT`
- `SHORTENER_BASE_URL`
- `SHORTENER_API_TOKEN`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `PUBLIC_BASE_URL`
- `TELEGRAM_POLL_TIMEOUT_SECONDS`

## Setup

1. Install Node.js.
2. Install dependencies:

```powershell
npm install
```

3. Create `.env` from `.env.example`.
4. Add your MongoDB connection string and secrets.
5. Start the server:

```powershell
npm start
```

6. Open:

- Public site: [http://localhost:3000](http://localhost:3000)
- Admin panel: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

## Telegram Bot Setup

1. Create a bot with BotFather on Telegram.
2. Copy the bot token into `TELEGRAM_BOT_TOKEN`.
3. Copy the bot username into `TELEGRAM_BOT_USERNAME` without the `@`.
4. Start the server.
5. In the admin panel, save the same bot username in Site Settings.
6. Add a licensed download URL to any movie you want the bot to deliver.

The server uses Telegram long polling, so you do not need to configure a webhook for local development.

## Notes

- If `TELEGRAM_BOT_TOKEN` is missing, the website still works and the bot stays disabled.
- If a movie has no licensed download URL, the website falls back to its normal Telegram CTA.
- If `SHORTENER_API_TOKEN` is empty, free-plan users open links directly.
- The admin panel returns full movie data, but the public site only gets bot availability, not the private download URL.
