# Embedding Plinko in bbcasino

This repo exposes an embeddable `/embed` route and a postMessage bridge so the
bbcasino host can own the wallet/ledger while rendering the game in an iframe.

## Suggested integration steps

1. Add the iframe in the bbcasino page where you want the game rendered:

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

2. When the iframe loads, initialize it with the player wallet values from
   bbcasino’s database:

```js
const iframe = document.querySelector('iframe');

iframe.contentWindow.postMessage(
  {
    type: 'plinko:init',
    payload: {
      balance: wallet.balance,
      betAmount: wallet.defaultBet,
      rowCount: wallet.rowCount,
      riskLevel: wallet.riskLevel,
      sessionId: wallet.sessionId,
      userId: wallet.userId,
      targetOrigin: 'https://your-hosted-plinko-site.example.com',
    },
  },
  'https://your-hosted-plinko-site.example.com',
);
```

3. Listen to emitted events and persist them to the bbcasino ledger:

```js
window.addEventListener('message', async (event) => {
  if (!event.data || typeof event.data.type !== 'string') return;

  switch (event.data.type) {
    case 'plinko:bet':
      await api.post('/ledger/bet', event.data.payload);
      break;
    case 'plinko:result':
      await api.post('/ledger/result', event.data.payload);
      break;
    case 'plinko:balance':
      // Optional: update wallet display for the user.
      break;
  }
});
```

## Notes

- Use a strict `targetOrigin` whenever possible.
- The embed bridge includes `sessionId` and `userId` on emitted events if you
  provide them in `plinko:init`, making it easy to link events to your database.
