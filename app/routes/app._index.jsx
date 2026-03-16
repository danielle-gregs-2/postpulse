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
    revealAtSeconds: parseInt(formData.get("revealAtSeconds") || "0"),
    revealParagraph: formData.get("revealParagraph") || "",
  };

  await prisma.offerSettings.upsert({
    where: { shop: session.shop },
    create: { shop: session.shop, ...data },
    update: data,
  });

  return { success: true };
};

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

  const ctaText =
    (form.ctaCopy || "Yes! Add to my order") +
    (form.offerPrice ? ` — ${form.offerPrice}` : "") +
    (form.originalPrice ? ` (was ${form.originalPrice})` : "");

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
        {form.thumbnailUrl && (
          <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", marginBottom: 16, aspectRatio: "16/9", background: "#1a1a2e" }}>
            <img src={form.thumbnailUrl} alt="thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
              <div style={{ width: 48, height: 48, background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>▶</div>
            </div>
          </div>
        )}
        {form.paragraph && (
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6, marginBottom: 20 }}>{form.paragraph}</div>
        )}
        {form.revealAtSeconds > 0 && form.revealParagraph && (
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6, marginBottom: 20, background: "#f0eeff", padding: 12, borderRadius: 8, borderLeft: "3px solid #7c6af7" }}>
            <div style={{ fontSize: 11, color: "#7c6af7", fontWeight: 600, marginBottom: 4 }}>REVEALS AT {form.revealAtSeconds}s</div>
            {form.revealParagraph}
          </div>
        )}
        {form.selectedProductTitle && (
          <div style={{ fontSize: 12, color: "#888", marginBottom: 8, textAlign: "center" }}>Product: {form.selectedProductTitle}</div>
        )}
        <button style={{ display: "block", width: "100%", background: form.brandColor || "#7c6af7", color: "white", border: "none", padding: "14px 16px", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 10 }}>
          {ctaText}
        </button>
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
    revealAtSeconds: 0,
    revealParagraph: "",
    ...loaded,
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const selectedProduct = products.find(p => p.id === form.selectedProductId);
  const variants = selectedProduct ? selectedProduct.variants.edges.map(e => e.node) : [];

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    update("selectedProductId", productId);
    update("selectedProductTitle", product ? product.title : "");
    update("selectedVariantId", product ? product.variants.edges[0].node.id : "");
  };

  const handleSave = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    fetcher.submit(fd, { method: "POST" });
  };

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 };
  const sectionStyle = { background: "white", borderRadius: 12, padding: 20, marginBottom: 16, border: "1px solid #e0e0e0" };

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
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Reveal extra content at video timestamp (seconds)</label>
              <input type="number" value={form.revealAtSeconds || 0} placeholder="e.g. 271 for 4:31" onChange={(e) => update("revealAtSeconds", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Extra content to reveal at that timestamp</label>
              <textarea value={form.revealParagraph || ""} onChange={(e) => update("revealParagraph", e.target.value)} rows={4} placeholder="This content appears when the video reaches the timestamp above..." style={inputStyle} />
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
                <select value={form.selectedVariantId} onChange={(e) => update("selectedVariantId", e.target.value)} style={inputStyle}>
                  {variants.map(v => (
                    <option key={v.id} value={v.id}>{v.title} — ${v.price}</option>
                  ))}
                </select>
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
              <label style={labelStyle}>Offer Price</label>
              <input type="text" value={form.offerPrice} onChange={(e) => update("offerPrice", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Original Price</label>
              <input type="text" value={form.originalPrice} onChange={(e) => update("originalPrice", e.target.value)} style={inputStyle} />
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