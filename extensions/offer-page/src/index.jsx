import { extend, render } from "@shopify/post-purchase-ui-extensions-react";

extend("Checkout::PostPurchase::ShouldRender", async ({ storage }) => {
  await storage.update({});
  return { render: true };
});

render("Checkout::PostPurchase::Render", App);

export function App() {
  const shop = window.location.hostname;
  const offerUrl = `https://postpulse-production.up.railway.app/offer?shop=${shop}`;
  window.location.href = offerUrl;
  return null;
}