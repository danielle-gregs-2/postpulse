import { useState, useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await prisma.offerSettings.findUnique({
    where: { shop: session.shop },
  });
  return settings || {};
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
    form.countdownMin * 60 + form.countdownSec
  );

  useEffect(() => {
    if (!form.showCountdown) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [form.showCountdown]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  const ctaText =
    form.ctaCopy +
    (form.offerPrice ? ` — ${form.offerPrice}` : "") +
    (form.originalPrice ? ` (was ${form.originalPrice})` : "");

  return (
    <div style={{
      fontFamily: "sans-serif",
      background: "#f5f3ff",
      borderRadius: 16,
      overflow: "hidden",
      border: "1px solid #e0e0e0",
      maxWidth: 360,
      margin: "0 auto",
    }}>
      {form.announcementBar && (
        <div style={{
          background: form.brandColor || "#7c6af7",
          color: "white",
          padding: "10px 16px",
          textAlign: "center",
          fontSize: 13,
          fontWeight: 500,
        }}>
          <div>{form.barMessage}</div>
          {form.showCountdown && (
            <div style={{ fontFamily: "monospace", fontSize: 16, marginTop: 4, letterSpacing: 2 }}>
              {mins}:{secs}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: "20px 16px" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", marginBottom: 8 }}>
          {form.title}
        </div>
        <div style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
          {form.subtitle}
        </div>

        {form.thumbnailUrl && (
          <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", marginBottom: 16, aspectRatio: "16/9", background: "#1a1a2e" }}>
            <img src={form.thumbnailUrl} alt="thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
              <div style={{ width: 48, height: 48, background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>▶</div>
            </div>
            {form.ctaDelaySeconds > 0 && (
              <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.7)", color: "white", fontSize: 11, padding: "3px 8px", borderRadius: 4, fontFamily: "monospace" }}>
                CTA at {form.ctaDelaySeconds}s
              </div>
            )}
          </div>
        )}

        {form.paragraph && (
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6, marginBottom: 20 }}>
            {form.paragraph}
          </div>
        )}

        <button style={{
          display: "block", width: "100%",
          background: form.brandColor || "#7c6af7",
          color: "white", border: "none",
          padding: "14px 16px", borderRadius: 10,
          fontSize: 15, fontWeight: 600, cursor: "pointer",
          marginBottom: 10,
        }}>
          {ctaText || "Yes! Add to my order"}
        </button>

        <div style={{ textAlign: "center", fontSize: 12, color: "#888", textDecoration: "underline", cursor: "pointer" }}>
          {form.declineMessage}
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const loaded = useLoaderData();
  const fetcher = useFetcher();
  const isSaving = fetcher.state === "submitting";

  const [form, setForm] = useState({
    announcementBar: true,
    barMessage: "⚡ Special one-time offer just for you!",
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
    ...loaded,
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    fetcher.submit(fd, { method: "POST" });
  };

  return (
    <s-page heading="PostPulse — Post-Purchase Offer Builder">
      <s-button slot="primary-action" variant="primary" onClick={handleSave}>
        {isSaving ? "Saving..." : "Save Offer"}
      </s-button>

      {fetcher.data?.success && (
        <s-banner tone="success">✅ Settings saved!</s-banner>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
        <div>
          <s-section heading="Announcement Bar">
            <s-checkbox label="Show Announcement Bar" checked={form.announcementBar} onChange={(e) => update("announcementBar", e.target.checked)} />
            <s-text-field label="Bar Message" value={form.barMessage} onChange={(e) => update("barMessage", e.target.value)} />
            <s-checkbox label="Show Countdown Timer" checked={form.showCountdown} onChange={(e) => update("showCountdown", e.target.checked)} />
            <s-text-field label="Brand Color (hex)" value={form.brandColor} onChange={(e) => update("brandColor", e.target.value)} />
          </s-section>

          <s-section heading="Title & Subtitle">
            <s-text-field label="Headline" value={form.title} onChange={(e) => update("title", e.target.value)} />
            <s-text-field label="Subtitle" value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} />
          </s-section>

          <s-section heading="Video">
            <s-text-field label="Video URL" value={form.videoUrl} placeholder="https://youtube.com/watch?v=..." onChange={(e) => update("videoUrl", e.target.value)} />
            <s-text-field label="Thumbnail URL" value={form.thumbnailUrl} placeholder="https://..." onChange={(e) => update("thumbnailUrl", e.target.value)} />
          </s-section>

          <s-section heading="CTA Timing">
            <s-text-field label="Show CTA after (seconds into video)" value={String(form.ctaDelaySeconds)} onChange={(e) => update("ctaDelaySeconds", e.target.value)} />
          </s-section>

          <s-section heading="Paragraph Content">
            <s-text-field label="Body Text (max 5,000 chars)" multiline value={form.paragraph} onChange={(e) => update("paragraph", e.target.value)} />
          </s-section>

          <s-section heading="CTA Button">
            <s-text-field label="Button Copy" value={form.ctaCopy} onChange={(e) => update("ctaCopy", e.target.value)} />
            <s-text-field label="Offer Price" value={form.offerPrice} onChange={(e) => update("offerPrice", e.target.value)} />
            <s-text-field label="Original Price" value={form.originalPrice} onChange={(e) => update("originalPrice", e.target.value)} />
            <s-text-field label="Decline Message" value={form.declineMessage} onChange={(e) => update("declineMessage", e.target.value)} />
          </s-section>
        </div>

        <div style={{ position: "sticky", top: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "#888", marginBottom: 12, textAlign: "center" }}>
            Live Preview
          </div>
          <Preview form={form} />
        </div>
      </div>
    </s-page>
  );
}