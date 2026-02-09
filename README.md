<div align="center">
  <img src="./static/android-chrome-192x192.png" width="100" height="100" alt="Logo">
  <h1>plinko-game</h1>
  <p>A web Plinko game inspired by Stake.com's Plinko game.</p>
  <p>Play now 👉 <a href="https://plinko-web-game.netlify.app/" target="_blank" rel="noreferrer">https://plinko-web-game.netlify.app/</a></p>
  <img src="./screenshots/desktop-1.jpg" width="800">
</div>

## About

Plinko is a classic game where the player drops a ball in a multi-row pin pyramid, where the ball bounces randomly until it reaches the payout bins at the bottom.

This project is a replication of [Stake.com's Plinko game](https://stake.com/casino/games/plinko), created using [Svelte](https://svelte.dev/), [Tailwind CSS](https://tailwindcss.com/), and [matter-js](https://github.com/liabru/matter-js). This website is a fun personal project to learn Svelte, and it is not affiliated with Stake.com in any way. I don't encourage gambling, so that's why I created a free-to-play version of the game.

### This project is NON-PROFIT

Please do NOT send me emails or invitations asking me to implement a Plinko game for your company or personal portfolio. This project is for personal hobby only. It is NOT a promotion, and I will IGNORE any freelance invitations 🙏.

Please fork this project on your own if you want to build on top of it.

## Features

- 🤑 100% free to play, add money at any time (~~not another crypto scam~~)
- 🤖 Manual and auto-bet modes
- 📊 Real-time live stats
- 📱 Responsive design

## Embedding & Casino Integration

Use the `/embed` route and the `postMessage` API below to embed this game into a casino website.
The host site owns the balance, bet ledger, and database. The game starts with a zero balance in
embed mode until your site sends `plinko:init`. The game only emits bet, result, balance, and
config signals, so you can persist them on your end.

### 1) Embed the game

```html
<iframe
  src="https://your-hosted-plinko-site.example.com/embed"
  title="Plinko"
  width="100%"
  height="720"
  style="border: 0"
  allow="autoplay; fullscreen"
></iframe>
```

### 2) Initialize from the casino wallet

Send an init message with the user’s balance and optional configuration. The game will use this
instead of local storage.

```js
const iframe = document.querySelector('iframe');

iframe.contentWindow.postMessage(
  {
    type: 'plinko:init',
    payload: {
      balance: 1250,
      betAmount: 5,
      rowCount: 16,
      riskLevel: 'MEDIUM',
      sessionId: 'session_123',
      userId: 'user_456',
      targetOrigin: 'https://your-hosted-plinko-site.example.com',
    },
  },
  'https://your-hosted-plinko-site.example.com',
);
```

### 3) Listen for events to persist bets and results

Use the emitted events to create ledger entries in your database.

```js
window.addEventListener('message', (event) => {
  if (!event.data || typeof event.data.type !== 'string') return;

  switch (event.data.type) {
    case 'plinko:ready':
      console.log('Plinko is ready');
      break;
    case 'plinko:bet':
      // Persist a bet in your database
      console.log('Bet placed', event.data.payload);
      break;
    case 'plinko:result':
      // Persist result in your database
      console.log('Bet resolved', event.data.payload);
      break;
    case 'plinko:config':
      // Persist settings changes in your database
      console.log('Config updated', event.data.payload);
      break;
    case 'plinko:balance':
      // Optional: sync UI wallet with the game
      console.log('Balance update', event.data.payload.balance);
      break;
  }
});
```

**Emitted events**

- `plinko:ready` → `{ timestamp, pathname }`
- `plinko:bet` → `{ betAmount, rowCount, riskLevel, balance, sessionId?, userId? }`
- `plinko:result` → `{ betAmount, rowCount, riskLevel, binIndex, payout: { multiplier, value }, profit, balance, sessionId?, userId? }`
- `plinko:balance` → `{ balance, sessionId?, userId? }`
- `plinko:config` → `{ betAmount, rowCount, riskLevel, sessionId?, userId? }`

**Accepted commands**

- `plinko:init` → `{ balance, betAmount?, rowCount?, riskLevel?, sessionId?, userId?, targetOrigin? }`
- `plinko:set-balance` → `{ balance }`
- `plinko:config` → `{ betAmount?, rowCount?, riskLevel? }`
- `plinko:reset` → resets balance to zero (host should follow by sending a new balance)

### 4) Build the casino UI (balance, settings, bet history)

The embedded Plinko iframe has no balance bar, settings modal, or bet history. Build those in
your casino site and keep them in sync using the events/commands above:

- **Balance**: store balance in your database, send it in `plinko:init`, and update it whenever
  you receive `plinko:bet` (debit) or `plinko:result` (credit).
- **Settings**: render your own controls for bet amount, row count, and risk level. When the
  player changes those settings on your site, send `plinko:config` to the iframe. When the player
  changes them inside the iframe, listen for `plinko:config` to persist the change.
- **Bet history**: append an entry whenever you receive `plinko:bet` and resolve it when you
  receive `plinko:result`. The result payload includes the payout and profit so you can label wins
  and losses on your side.

## Limitations

The biggest limitation is that this project calculates the outcome on the client-side, so we cannot pre-determine the outcome before ball drop, nor force the ball to drop to a specific pin.

This is because this project uses [matter-js](https://github.com/liabru/matter-js) as the physics engine. This engine runs on client-side, so the outcome is unknown until the ball reaches the bottom. This is different from Stake.com's implementation, where they calculate the outcome in a back-end server, then drop the ball to the determined pin.

Due to the physics engine's unpredictability, the actual average return value may be higher than the expected value (sometimes positive return). This is problematic for real-money gambling, since casinos make money by having a [house advantage](https://en.wikipedia.org/wiki/Casino_game#House_advantage), where the expected return is always less than 1. This could be fixed by adjusting the bin payouts, but I stick to the original Stake.com's payout table for simplicity.

## Development

### Getting Started

> [!NOTE]
> Requires Node.js 20 or later.

1. Install [pnpm](https://pnpm.io/installation) version 9 or later
2. Clone this repository
3. Install dependencies

   ```bash
   pnpm install
   ```

4. Start the development server

   ```bash
   pnpm dev
   ```

### Building for Production

The entire site is statically generated using [@sveltejs/adapter-static](https://github.com/sveltejs/kit/tree/main/packages/adapter-static).

1. Generate a static build

   ```bash
   pnpm build
   ```

2. Preview the build site

   ```bash
   pnpm preview
   ```

### Testing

For unit tests, run:

```bash
pnpm test:unit
```

For end-to-end tests powered by [Playwright](https://playwright.dev/):

1. Build for production

   ```bash
   pnpm build
   ```

2. Run the tests

   ```bash
   # Run in UI mode (recommended when writing tests)
   pnpm test:e2e:ui

   # Alternatively, run in headless mode
   pnpm test:e2e
   ```

### Benchmark

A hidden page is only available in local dev environment to benchmark the payout probabilities and expected values. I used this page to tune the parameters of the matter-js physics engine and control the expected payout.

To visit this page, visit the below URL after starting the development server with `pnpm dev`:

```
http://localhost:5173/benchmark
```

## Release

This project uses [Netlify](https://www.netlify.com/) for deployment. To trigger a production deployment, create a commit with message starting with `chore(release)` in the `main` branch.

## More Screenshots

Mobile:

| Manual Mode                             | Auto Mode                               |
| --------------------------------------- | --------------------------------------- |
| ![Mobile 1](./screenshots/mobile-1.jpg) | ![Mobile 2](./screenshots/mobile-2.jpg) |
