import { useState, useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  
  const settings = await prisma.offerSettings.findUnique({
    where: { shop: session.shop },
  });

  const response = await admin.graphql(`
    query {
      products(first: 50) {
        edges {
          node {
            id
            title
            featuredImage {
              url
            }
            variants(first: 50) {
              edges {
                node {
                  id
                  title
                  price
                }
              }
            }
          }
        }
      }
    }
  `);
  const data = await response.json();
  const products = data.data.products.edges.map(e => e.node);

  return { settings: settings || {}, products };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const data = {
    announcementBar: formData.get("announcementBar") === "true",
    barMessage: formData.get("barMessage"),
    showCountdown: formData.get("showCountdown") === "true",
    brandColor: formData.get("brandColor"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    videoUrl: formData.get("videoUrl"),
    thumbnailUrl: formData.get("thumbnailUrl"),
    ctaDelaySeconds: parseInt(formData.get("ctaDelaySeconds") || "0"),
    paragraph: formData.get("paragraph"),
    ctaCopy: formData.get("ctaCopy"),
    offerPrice: formData.get("offerPrice"),
    originalPrice: formData.get("originalPrice"),
    declineMessage: formData.get("declineMessage"),
    selectedProductId: formData.get("selectedProductId") || "",
    selectedVariantId: formData.get("selectedVariantId") || "",
    selectedProductTitle: formData.get("selectedProductTitle") || "",
    selectedProductImage: formData.get("selectedProductImage") || "",
    selectedVariantPrice: formData.get("selectedVariantPrice") || "",
    revealAtSeconds: parseInt(formData.get("revealAtSeconds") || "0"),
    revealTitle: formData.get("revealTitle") || "",
    revealSubtitle: formData.get("revealSubtitle") || "",
    revealParagraph: formData.get("revealParagraph") || "",
    discountType: formData.get("discountType") || "percentage",
    discountValue: formData.get("discountValue") || "",
  };

  await prisma.offerSettings.upsert({
    where: { shop: session.shop },
    create: { shop: session.shop, ...data },
    update: data,
  });

  return { success: true };
};

function calcDiscountedPrice(price, discountType, discountValue) {
  if (!price || !discountValue) return null;
  const p = parseFloat(price);
  const v = parseFloat(discountValue);
  if (isNaN(p) || isNaN(v)) return null;
  if (discountType === "percentage") return (p * (1 - v / 100)).toFixed(2);
  if (discountType === "fixed") return Math.max(0, p - v).toFixed(2);
  return null;
}

function Preview({ form }) {
  const [seconds, setSeconds] = useState(
    (form.countdownMin || 14) * 60 + (form.countdownSec || 59)
  );

  useEffect(() => {
    if (!form.showCountdown) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [form.showCountdown]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  const ctaText = (form.ctaCopy || "Yes! Add to my order");
  const discountedPrice = calcDiscountedPrice(form.selectedVariantPrice, form.discountType, form.discountValue);

  return (
    <div style={{ fontFamily: "sans-serif", background: "#f5f3ff", borderRadius: 16, overflow: "hidden", border: "1px solid #e0e0e0", maxWidth: 360, margin: "0 auto" }}>
      {form.announcementBar && (
        <div style={{ background: form.brandColor || "#7c6af7", color: "white", padding: "10px 16px", textAlign: "center", fontSize: 13, fontWeight: 500 }}>
          <div>{form.barMessage}</div>
          {form.showCountdown && (
            <div style={{ fontFamily: "monospace", fontSize: 16, marginTop: 4, letterSpacing: 2 }}>{mins}:{secs}</div>
          )}
        </div>
      )}
      <div style={{ padding: "20px 16px" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", marginBottom: 8 }}>{form.title}</div>
        <div style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>{form.subtitle}</div>
        {form.paragraph && (
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6, marginBottom: 20 }}>{form.paragraph}</div>
        )}
        {(form.revealTitle || form.revealSubtitle || form.revealParagraph || form.selectedProductTitle) && (
          <div style={{ background: "#f0eeff", borderLeft: "3px solid #7c6af7", borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#7c6af7", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Reveals at {form.revealAtSeconds}s</div>
            {form.revealTitle && <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>{form.revealTitle}</div>}
            {form.revealSubtitle && <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>{form.revealSubtitle}</div>}
            {form.revealParagraph && <div style={{ fontSize: 12, color: "#444", lineHeight: 1.6, marginBottom: 12 }}>{form.revealParagraph}</div>}
            {form.selectedProductTitle && (
              <div style={{ background: "white", borderRadius: 8, padding: 10, display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                {form.selectedProductImage && (
                  <img src={form.selectedProductImage} alt="product" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }} />
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{form.selectedProductTitle}</div>
                  {discountedPrice ? (
                    <div style={{ fontSize: 13, marginTop: 2 }}>
                      <span style={{ textDecoration: "line-through", color: "#999", marginRight: 6 }}>${parseFloat(form.selectedVariantPrice).toFixed(2)}</span>
                      <span style={{ color: "#e53e3e", fontWeight: 700 }}>${discountedPrice}</span>
                    </div>
                  ) : form.selectedVariantPrice ? (
                    <div style={{ fontSize: 13, color: "#444", marginTop: 2 }}>${parseFloat(form.selectedVariantPrice).toFixed(2)}</div>
                  ) : null}
                </div>
              </div>
            )}
            <button style={{ display: "block", width: "100%", background: form.brandColor || "#7c6af7", color: "white", border: "none", padding: "12px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {ctaText}
            </button>
          </div>
        )}
        <div style={{ textAlign: "center", fontSize: 12, color: "#888", textDecoration: "underline", cursor: "pointer" }}>{form.declineMessage}</div>
      </div>
    </div>
  );
}

export default function Index() {
  const { settings: loaded, products } = useLoaderData();
  const fetcher = useFetcher();
  const isSaving = fetcher.state === "submitting";

  const [form, setForm] = useState({
    announcementBar: true,
    barMessage: "Special one-time offer just for you!",
    showCountdown: true,
    countdownMin: 14,
    countdownSec: 59,
    brandColor: "#7c6af7",
    title: "Wait — before you go!",
    subtitle: "We've got an exclusive upgrade offer available only right now.",
    videoUrl: "",
    thumbnailUrl: "",
    ctaDelaySeconds: 0,
    paragraph: "",
    ctaCopy: "Yes! Add to my order",
    offerPrice: "",
    originalPrice: "",
    declineMessage: "No thanks, I'll pass on this deal.",
    selectedProductId: "",
    selectedVariantId: "",
    selectedProductTitle: "",
    selectedProductImage: "",
    selectedVariantPrice: "",
    revealAtSeconds: 0,
    revealTitle: "",
    revealSubtitle: "",
    revealParagraph: "",
    discountType: "percentage",
    discountValue: "",
    ...loaded,
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const selectedProduct = products.find(p => p.id === form.selectedProductId);
  const variants = selectedProduct ? selectedProduct.variants.edges.map(e => e.node) : [];

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    const firstVariant = product ? product.variants.edges[0].node : null;
    update("selectedProductId", productId);
    update("selectedProductTitle", product ? product.title : "");
    update("selectedProductImage", product?.featuredImage?.url || "");
    update("selectedVariantId", firstVariant ? firstVariant.id : "");
    update("selectedVariantPrice", firstVariant ? firstVariant.price : "");
  };

  const handleVariantChange = (variantId) => {
    const variant = variants.find(v => v.id === variantId);
    update("selectedVariantId", variantId);
    update("selectedVariantPrice", variant ? variant.price : "");
  };

  const handleSave = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    fetcher.submit(fd, { method: "POST" });
  };

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 };
  const sectionStyle = { background: "white", borderRadius: 12, padding: 20, marginBottom: 16, border: "1px solid #e0e0e0" };

  const discountedPrice = calcDiscountedPrice(form.selectedVariantPrice, form.discountType, form.discountValue);

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a2e" }}>PostPulse — Offer Builder</h1>
        <button onClick={handleSave} style={{ background: form.brandColor || "#7c6af7", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 15 }}>
          {isSaving ? "Saving..." : "Save Offer"}
        </button>
      </div>

      {fetcher.data?.success && (
        <div style={{ background: "#d4edda", border: "1px solid #c3e6cb", color: "#155724", padding: "10px 16px", borderRadius: 8, marginBottom: 16 }}>
          Settings saved successfully!
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
        <div>
          <div style={sectionStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Announcement Bar</h2>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <input type="checkbox" checked={form.announcementBar} onChange={(e) => update("announcementBar", e.target.checked)} />
              Show Announcement Bar
            </label>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Bar Message</label>
              <input type="text" value={form.barMessage} onChange={(e) => update("barMessage", e.target.value)} style={inputStyle} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <input type="checkbox" checked={form.showCountdown} onChange={(e) => update("showCountdown", e.target.checked)} />
              Show Countdown Timer
            </label>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Brand Color (hex)</label>
              <input type="text" value={form.brandColor} onChange={(e) => update("brandColor", e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Title & Subtitle</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Headline</label>
              <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Subtitle</label>
              <input type="text" value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Video</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Video URL</label>
              <input type="text" value={form.videoUrl} placeholder="https://youtube.com/watch?v=..." onChange={(e) => update("videoUrl", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Thumbnail URL</label>
              <input type="text" value={form.thumbnailUrl} placeholder="https://..." onChange={(e) => update("thumbnailUrl", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Show CTA after (seconds into video)</label>
              <input type="number" value={form.ctaDelaySeconds} onChange={(e) => update("ctaDelaySeconds", e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Reveal Content at Timestamp</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Reveal at (seconds into video)</label>
              <input type="number" value={form.revealAtSeconds || 0} placeholder="e.g. 271 for 4:31" onChange={(e) => update("revealAtSeconds", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Reveal Title</label>
              <input type="text" value={form.revealTitle || ""} onChange={(e) => update("revealTitle", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Reveal Subtitle</label>
              <input type="text" value={form.revealSubtitle || ""} onChange={(e) => update("revealSubtitle", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Reveal Paragraph (max 3,000 characters)</label>
              <textarea
                value={form.revealParagraph || ""}
                onChange={(e) => { if (e.target.value.length <= 3000) update("revealParagraph", e.target.value); }}
                rows={5}
                style={inputStyle}
              />
              <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{(form.revealParagraph || "").length}/3000</div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Product to Offer</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Select Product</label>
              <select value={form.selectedProductId} onChange={(e) => handleProductChange(e.target.value)} style={inputStyle}>
                <option value="">— Choose a product —</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            {variants.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Select Variant</label>
                <select value={form.selectedVariantId} onChange={(e) => handleVariantChange(e.target.value)} style={inputStyle}>
                  {variants.map(v => (
                    <option key={v.id} value={v.id}>{v.title} — ${v.price}</option>
                  ))}
                </select>
              </div>
            )}
            {form.selectedVariantPrice && (
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Discount Type</label>
                <select value={form.discountType} onChange={(e) => update("discountType", e.target.value)} style={inputStyle}>
                  <option value="percentage">Percentage Off (%)</option>
                  <option value="fixed">Fixed Amount Off ($)</option>
                </select>
              </div>
            )}
            {form.selectedVariantPrice && (
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>{form.discountType === "percentage" ? "Discount Percentage" : "Discount Amount ($)"}</label>
                <input
                  type="number"
                  value={form.discountValue}
                  placeholder={form.discountType === "percentage" ? "e.g. 20 for 20% off" : "e.g. 10 for $10 off"}
                  onChange={(e) => update("discountValue", e.target.value)}
                  style={inputStyle}
                />
                {discountedPrice && (
                  <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
                    Original: <span style={{ textDecoration: "line-through" }}>${parseFloat(form.selectedVariantPrice).toFixed(2)}</span>
                    {" → "}
                    <span style={{ color: "#e53e3e", fontWeight: 700 }}>${discountedPrice}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={sectionStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Body Text</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Paragraph</label>
              <textarea value={form.paragraph} onChange={(e) => update("paragraph", e.target.value)} rows={4} style={inputStyle} />
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>CTA Button</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Button Copy</label>
              <input type="text" value={form.ctaCopy} onChange={(e) => update("ctaCopy", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Decline Message</label>
              <input type="text" value={form.declineMessage} onChange={(e) => update("declineMessage", e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={{ position: "sticky", top: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "#888", marginBottom: 12, textAlign: "center" }}>
            Live Preview
          </div>
          <Preview form={form} />
        </div>
      </div>
    </div>
  );
}