import express from 'express';
import playwright from 'playwright';
const app = express();

const PORT = 3000;

export async function generateIdentificationEvent(
  publicApiKey: string,
  region: 'us' | 'eu' | 'ap' = 'us',
  subscriptionName?: string
): Promise<{ requestId: string; visitorId: string }> {
  if (subscriptionName) {
    console.log('\nGenerarating identification event for subscription: ', subscriptionName);
  }
  // Run a hello world HTTP Server
  app.get('/', (_req, res) => {
    res.send('Hello, World! Page loaded correctly.');
  });
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Use Puppeteer to visit the server page in a headless browser
  const browser = await playwright['chromium'].launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'load' });

  // Print page content to confirm browser opened correctly
  const bodyText = await page.evaluate(() => document.querySelector('body')?.innerText);
  console.log(bodyText);

  // Identify the browser with Fingerprint
  console.log(`Identifying the browser with Fingerprint, using publicApiKey: ${publicApiKey}, region: ${region}`);
  const { requestId, visitorId } = await page.evaluate(
    async ({ publicApiKey, region }) => {
      const fpPromise = import(`https://fpjscdn.net/v3/${publicApiKey}`).then((FingerprintJS) =>
        FingerprintJS.load({
          region,
        })
      );
      return await (await fpPromise).get({ linkedId: 'OpenAPI schema validation tests' });
    },
    { publicApiKey, region }
  );

  // Shut down the server and browser
  await browser.close();
  server.close();

  // Return the requestId and visitorId
  console.log(`requestId: ${requestId}`);
  console.log(`visitorId: ${visitorId}`);
  return { requestId, visitorId };
}
