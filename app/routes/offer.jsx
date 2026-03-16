import prisma from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  const settings = await prisma.offerSettings.findUnique({
    where: { shop },
  });

  const s = settings || {};

  const announcementBar = s.announcementBar !== false;
  const barMessage = s.barMessage || "Special one-time offer just for you!";
  const showCountdown = s.showCountdown !== false;
  const countdownMin = s.countdownMin || 14;
  const brandColor = s.brandColor || "#7c6af7";
  const title = s.title || "Wait — before you go!";
  const videoUrl = s.videoUrl || "";
  const ctaCopy = s.ctaCopy || "Yes! Add to my order";
  const declineMessage = s.declineMessage || "No thanks, I'll pass on this deal.";
  const selectedVariantId = s.selectedVariantId || "";
  const selectedProductTitle = s.selectedProductTitle || "";
  const selectedProductImage = s.selectedProductImage || "";
  const selectedVariantPrice = s.selectedVariantPrice || "";
  const revealAtSeconds = s.revealAtSeconds || 0;
  const revealTitle = s.revealTitle || "";
  const revealSubtitle = s.revealSubtitle || "";
  const revealParagraph = s.revealParagraph || "";
  const discountType = s.discountType || "percentage";
  const discountValue = s.discountValue || "";

  let discountedPrice = null;
  if (selectedVariantPrice && discountValue) {
    const p = parseFloat(selectedVariantPrice);
    const v = parseFloat(discountValue);
    if (!isNaN(p) && !isNaN(v)) {
      if (discountType === "percentage") discountedPrice = (p * (1 - v / 100)).toFixed(2);
      if (discountType === "fixed") discountedPrice = Math.max(0, p - v).toFixed(2);
    }
  }

  let ytId = null;
  if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
    if (videoUrl.includes("v=")) ytId = videoUrl.split("v=")[1].split("&")[0];
    else if (videoUrl.includes("youtu.be/")) ytId = videoUrl.split("youtu.be/")[1].split("?")[0];
    else ytId = videoUrl.split("/").pop().split("?")[0];
  }

  const embedUrl = ytId
    ? `https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1`
    : videoUrl.includes("vimeo.com")
    ? `https://player.vimeo.com/video/${videoUrl.split("vimeo.com/")[1].split("?")[0]}?autoplay=1`
    : null;

  const isMP4 = videoUrl && !embedUrl;
  const numericVariantId = selectedVariantId ? selectedVariantId.split("/").pop() : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Special Offer</title>
  ${ytId ? '<script src="https://www.youtube.com/iframe_api"></script>' : ''}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; background: #f5f5f5; }

    .ann-bar {
      display: none;
      background: ${brandColor};
      color: white;
      text-align: center;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 500;
    }
    .ann-bar.visible { display: block; animation: fadeIn 0.6s ease; }
    .countdown { font-family: monospace; font-size: 20px; font-weight: 700; letter-spacing: 3px; margin-top: 4px; }

    .container { max-width: 680px; margin: 0 auto; padding: 32px 20px; }
    .pre-title { font-size: 28px; font-weight: 700; color: #1a1a2e; margin-bottom: 24px; line-height: 1.2; }

    .video-wrapper { position: relative; padding-bottom: 56.25%; height: 0; border-radius: 14px; overflow: hidden; margin-bottom: 24px; background: #000; }
    .video-wrapper iframe, .video-wrapper video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }

    .reveal-content { display: none; }
    .reveal-content.visible { display: block; animation: fadeIn 0.6s ease; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

    .reveal-title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; line-height: 1.2; }
    .reveal-subtitle { font-size: 16px; color: #555; margin-bottom: 16px; line-height: 1.5; }
    .reveal-paragraph { font-size: 15px; color: #444; line-height: 1.7; margin-bottom: 20px; }

    .product-card { display: flex; gap: 14px; align-items: center; background: white; border-radius: 12px; padding: 14px; margin-bottom: 20px; border: 1px solid #e0e0e0; }
    .product-img { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
    .product-info { flex: 1; }
    .product-name { font-size: 15px; font-weight: 600; color: #1a1a2e; margin-bottom: 6px; }
    .price-row { display: flex; align-items: center; gap: 8px; }
    .original-price { font-size: 14px; color: #999; text-decoration: line-through; }
    .discounted-price { font-size: 18px; font-weight: 700; color: #e53e3e; }
    .regular-price { font-size: 16px; font-weight: 600; color: #1a1a2e; }

    .cta-btn { display: block; width: 100%; background: ${brandColor}; color: white; border: none; padding: 18px; border-radius: 12px; font-size: 17px; font-weight: 700; cursor: pointer; margin-bottom: 14px; transition: opacity 0.2s; }
    .cta-btn:hover { opacity: 0.9; }
    .adding { opacity: 0.7; pointer-events: none; }

    .decline { display: block; text-align: center; font-size: 13px; color: #999; text-decoration: underline; cursor: pointer; padding: 8px; background: none; border: none; width: 100%; }
  </style>
</head>
<body>
  <div class="ann-bar" id="ann-bar">
    <div>${barMessage}</div>
    ${showCountdown && announcementBar ? `<div class="countdown" id="countdown">${String(countdownMin).padStart(2,"0")}:00</div>` : ''}
  </div>

  <div class="container">
    <div class="pre-title">${title}</div>

    ${embedUrl ? `<div class="video-wrapper"><iframe id="offer-video" src="${embedUrl}" allow="autoplay; fullscreen" allowfullscreen></iframe></div>` : ''}
    ${isMP4 ? `<div class="video-wrapper"><video id="offer-video-mp4" controls autoplay src="${videoUrl}"></video></div>` : ''}

    <div class="reveal-content" id="reveal-content">
      ${revealTitle ? `<div class="reveal-title">${revealTitle}</div>` : ''}
      ${revealSubtitle ? `<div class="reveal-subtitle">${revealSubtitle}</div>` : ''}
      ${revealParagraph ? `<div class="reveal-paragraph">${revealParagraph}</div>` : ''}

      ${selectedProductTitle ? `
      <div class="product-card">
        ${selectedProductImage ? `<img class="product-img" src="${selectedProductImage}" alt="${selectedProductTitle}" />` : ''}
        <div class="product-info">
          <div class="product-name">${selectedProductTitle}</div>
          <div class="price-row">
            ${discountedPrice ? `
              <span class="original-price">$${parseFloat(selectedVariantPrice).toFixed(2)}</span>
              <span class="discounted-price">$${discountedPrice}</span>
            ` : selectedVariantPrice ? `
              <span class="regular-price">$${parseFloat(selectedVariantPrice).toFixed(2)}</span>
            ` : ''}
          </div>
        </div>
      </div>` : ''}

      <button class="cta-btn" id="cta-btn">${ctaCopy}</button>
      <button class="decline" id="decline-btn">${declineMessage}</button>
    </div>
  </div>

  <script>
    var SHOP = "${shop}";
    var VARIANT_ID = "${numericVariantId}";
    var REVEAL_AT = ${revealAtSeconds};
    var revealed = false;

    // Countdown (only starts after reveal)
    var cdSecs = ${countdownMin * 60};
    var cdEl = document.getElementById('countdown');
    function startCountdown() {
      if (!cdEl) return;
      setInterval(function() {
        if (cdSecs > 0) cdSecs--;
        var m = String(Math.floor(cdSecs/60)).padStart(2,'0');
        var s = String(cdSecs%60).padStart(2,'0');
        cdEl.textContent = m+':'+s;
      }, 1000);
    }

    function revealContent() {
      if (revealed) return;
      revealed = true;
      // Show announcement bar
      var annBar = document.getElementById('ann-bar');
      if (annBar) annBar.classList.add('visible');
      startCountdown();
      // Show reveal content
      var el = document.getElementById('reveal-content');
      if (el) el.classList.add('visible');
    }

    // YouTube API
    var ytPlayer;
    window.onYouTubeIframeAPIReady = function() {
      ytPlayer = new YT.Player('offer-video', {
        events: {
          onReady: function() {
            if (REVEAL_AT > 0) {
              setInterval(function() {
                if (ytPlayer.getCurrentTime() >= REVEAL_AT) revealContent();
              }, 500);
            }
          }
        }
      });
    };

    if (REVEAL_AT > 0) {
      setTimeout(function() {
        if (!ytPlayer) setTimeout(revealContent, REVEAL_AT * 1000);
      }, 3000);
    }

    // MP4
    var mp4 = document.getElementById('offer-video-mp4');
    if (mp4 && REVEAL_AT > 0) {
      mp4.addEventListener('timeupdate', function() {
        if (mp4.currentTime >= REVEAL_AT) revealContent();
      });
    }

    // Add to cart
    var ctaBtn = document.getElementById('cta-btn');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', function() {
        if (!VARIANT_ID) { alert('No product selected.'); return; }
        ctaBtn.textContent = 'Adding...';
        ctaBtn.classList.add('adding');
        fetch('https://' + SHOP + '/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: VARIANT_ID, quantity: 1 })
        })
        .then(function(r) { return r.json(); })
        .then(function() { window.location.href = 'https://' + SHOP + '/cart'; })
        .catch(function() { ctaBtn.textContent = 'Try again'; ctaBtn.classList.remove('adding'); });
      });
    }

    // Decline
    document.getElementById('decline-btn').addEventListener('click', function() {
      document.body.innerHTML = '<div style="text-align:center;padding:60px 20px;font-family:sans-serif;"><h2>No problem!</h2><p style="color:#666;margin-top:10px;">Your order is confirmed. Thanks for shopping with us!</p></div>';
    });
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
};