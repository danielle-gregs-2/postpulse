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
  const subtitle = s.subtitle || "We've got an exclusive upgrade offer available only right now.";
  const videoUrl = s.videoUrl || "";
  const ctaDelaySeconds = s.ctaDelaySeconds || 0;
  const paragraph = s.paragraph || "";
  const ctaCopy = s.ctaCopy || "Yes! Add to my order";
  const offerPrice = s.offerPrice || "";
  const originalPrice = s.originalPrice || "";
  const declineMessage = s.declineMessage || "No thanks, I'll pass on this deal.";
  const selectedVariantId = s.selectedVariantId || "";
  const revealAtSeconds = s.revealAtSeconds || 0;
  const revealParagraph = s.revealParagraph || "";

  // Get YouTube ID
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

  const ctaText = ctaCopy
    + (offerPrice ? ` — ${offerPrice}` : "")
    + (originalPrice ? ` (was ${originalPrice})` : "");

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
    .ann-bar { background: ${brandColor}; color: white; text-align: center; padding: 12px 16px; font-size: 14px; font-weight: 500; }
    .countdown { font-family: monospace; font-size: 20px; font-weight: 700; letter-spacing: 3px; margin-top: 4px; }
    .container { max-width: 680px; margin: 0 auto; padding: 32px 20px; }
    .title { font-size: 28px; font-weight: 700; color: #1a1a2e; margin-bottom: 10px; line-height: 1.2; }
    .subtitle { font-size: 16px; color: #555; margin-bottom: 24px; line-height: 1.5; }
    .video-wrapper { position: relative; padding-bottom: 56.25%; height: 0; border-radius: 14px; overflow: hidden; margin-bottom: 24px; background: #000; }
    .video-wrapper iframe, .video-wrapper video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
    .paragraph { font-size: 15px; color: #444; line-height: 1.7; margin-bottom: 28px; }
    .reveal-content { display: none; }
    .reveal-content.visible { display: block; animation: fadeIn 0.6s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    .reveal-paragraph { font-size: 15px; color: #444; line-height: 1.7; margin-bottom: 28px; padding: 16px; background: #f0eeff; border-left: 3px solid ${brandColor}; border-radius: 8px; }
    .cta-btn { display: block; width: 100%; background: ${brandColor}; color: white; border: none; padding: 18px; border-radius: 12px; font-size: 17px; font-weight: 700; cursor: pointer; margin-bottom: 14px; transition: opacity 0.2s; }
    .cta-btn:hover { opacity: 0.9; }
    .cta-btn.hidden { opacity: 0.4; pointer-events: none; }
    .unlock-msg { text-align: center; font-size: 13px; color: #888; margin-bottom: 14px; font-style: italic; }
    .decline { display: block; text-align: center; font-size: 13px; color: #999; text-decoration: underline; cursor: pointer; padding: 8px; background: none; border: none; width: 100%; }
    .adding { opacity: 0.7; pointer-events: none; }
  </style>
</head>
<body>
  ${announcementBar ? `
  <div class="ann-bar">
    <div>${barMessage}</div>
    ${showCountdown ? `<div class="countdown" id="countdown">${String(countdownMin).padStart(2,"0")}:00</div>` : ''}
  </div>` : ''}

  <div class="container">
    <div class="title">${title}</div>
    <div class="subtitle">${subtitle}</div>

    ${embedUrl ? `
    <div class="video-wrapper">
      <iframe id="offer-video" src="${embedUrl}" allow="autoplay; fullscreen" allowfullscreen></iframe>
    </div>` : ''}

    ${isMP4 ? `
    <div class="video-wrapper">
      <video id="offer-video-mp4" controls autoplay src="${videoUrl}"></video>
    </div>` : ''}

    ${paragraph ? `<div class="paragraph">${paragraph}</div>` : ''}

    <div class="reveal-content" id="reveal-content">
      ${revealParagraph ? `<div class="reveal-paragraph">${revealParagraph}</div>` : ''}
    </div>

    ${ctaDelaySeconds > 0 ? `
    <div class="unlock-msg" id="unlock-msg">
      Your offer unlocks in <span id="cta-timer">${ctaDelaySeconds}</span> seconds...
    </div>` : ''}

    <button class="cta-btn${ctaDelaySeconds > 0 ? ' hidden' : ''}" id="cta-btn">
      ${ctaText || "Yes! Add to my order"}
    </button>

    <button class="decline" id="decline-btn">${declineMessage}</button>
  </div>

  <script>
    var SHOP = "${shop}";
    var VARIANT_ID = "${numericVariantId}";
    var REVEAL_AT = ${revealAtSeconds};
    var CTA_DELAY = ${ctaDelaySeconds};
    var revealed = false;

    // Countdown
    var cdSecs = ${countdownMin * 60};
    var cdEl = document.getElementById('countdown');
    if (cdEl) {
      setInterval(function() {
        if (cdSecs > 0) cdSecs--;
        var m = String(Math.floor(cdSecs/60)).padStart(2,'0');
        var s = String(cdSecs%60).padStart(2,'0');
        cdEl.textContent = m+':'+s;
      }, 1000);
    }

    var ctaBtn = document.getElementById('cta-btn');
    var unlockMsg = document.getElementById('unlock-msg');
    var ctaTimer = document.getElementById('cta-timer');

    // CTA delay
    if (CTA_DELAY > 0 && ctaBtn) {
      var remaining = CTA_DELAY;
      var t = setInterval(function() {
        remaining--;
        if (ctaTimer) ctaTimer.textContent = remaining;
        if (remaining <= 0) {
          clearInterval(t);
          ctaBtn.classList.remove('hidden');
          if (unlockMsg) unlockMsg.style.display = 'none';
        }
      }, 1000);
    }

    function revealContent() {
      if (revealed) return;
      revealed = true;
      var el = document.getElementById('reveal-content');
      if (el) el.classList.add('visible');
      console.log('Content revealed!');
    }

    // YouTube API
    var ytPlayer;
    window.onYouTubeIframeAPIReady = function() {
      console.log('YouTube API ready');
      ytPlayer = new YT.Player('offer-video', {
        events: {
          onReady: function() {
            console.log('Player ready, REVEAL_AT =', REVEAL_AT);
            if (REVEAL_AT > 0) {
              setInterval(function() {
                var currentTime = ytPlayer.getCurrentTime();
                if (currentTime >= REVEAL_AT) revealContent();
              }, 500);
            }
          }
        }
      });
    };

    // Fallback timer if YouTube API fails
    if (REVEAL_AT > 0) {
      setTimeout(function() {
        if (!ytPlayer) {
          console.log('YT API fallback triggered');
          setTimeout(revealContent, REVEAL_AT * 1000);
        }
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