import { extend, render } from "@shopify/post-purchase-ui-extensions-react";

extend("Checkout::PostPurchase::ShouldRender", async ({ storage }) => {
  await storage.update({});
  return { render: true };
});

render("Checkout::PostPurchase::Render", App);

export function App({ extensionPoint }) {
  const shop = window.location.hostname;
  const offerUrl = `https://YOUR-APP-URL.com/offer?shop=${shop}`;

  window.location.href = offerUrl;

  return null;
}
```

Save with **Cmd + S**.

Now before we deploy, we need to replace `YOUR-APP-URL.com` with your real app URL. Go to your **first terminal** (the one running the app) and look for a line that says something like:
```
Application URL: https://xxxx.trycloudflare.com
