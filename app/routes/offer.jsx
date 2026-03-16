import { useLoaderData } from "react-router";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  const settings = await prisma.offerSettings.findUnique({
    where: { shop },
  });

  return { ...(settings || {}), shop };
};

function getYouTubeId(videoUrl) {
  if (!videoUrl) return null;
  if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
    if (videoUrl.includes("v=")) return videoUrl.split("v=")[1].split("&")[0];
    if (videoUrl.includes("youtu.be/")) return videoUrl.split("youtu.be/")[1].split("?")[0];
    return videoUrl.split("/").pop().split("?")[0];
  }
  return null;
}

function getVideoEmbed(videoUrl) {
  if (!videoUrl) return null;
  const ytId = getYouTubeId(videoUrl);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent("https://postpulse-production.up.railway.app")}`;
  if (videoUrl.includes("vimeo.com")) {
    const id = videoUrl.split("vimeo.com/")[1].split("?")[0];
    return `https://player.vimeo.com/video/${id}?autoplay=1`;
  }
  return null;
}

export default function OfferPage() {
  const settings = useLoaderData();

  const {
    shop = "",
    announcementBar = true,
    barMessage = "Special one-time offer just for you!",
    showCountdown = true,
    countdownMin = 14,
    brandColor = "#7c6af7",
    title = "Wait — before you go!",
    subtitle = "We've got an exclusive upgrade offer available only right now.",
    videoUrl = "",
    ctaDelaySeconds = 0,
    paragraph = "",
    ctaCopy = "Yes! Add to my order",
    offerPrice = "",
    originalPrice = "",
    declineMessage = "No thanks, I'll pass on this deal.",
    selectedVariantId = "",
    revealAtSeconds = 0,
    revealParagraph = "",
  } = settings;

  const embedUrl = getVideoEmbed(videoUrl);
  const isMP4 = videoUrl && !embedUrl;
  const isYouTube = !!getYouTubeId(videoUrl);

  const ctaText = ctaCopy
    + (offerPrice ? ` — ${offerPrice}` : "")
    + (originalPrice ? ` (was ${originalPrice})` : "");

  const numericVariantId = selectedVariantId
    ? selectedVariantId.split("/").pop()
    : "";

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Special Offer</title>
        <style>{`
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
        `}</style>
      </head>
      <body>
        {announcementBar && (
          <div className="ann-bar">
            <div>{barMessage}</div>
            {showCountdown && (
              <div className="countdown" id="countdown">
                {String(countdownMin).padStart(2,"0")}:00
              </div>
            )}
          </div>
        )}

        <div className="container">
          <div className="title">{title}</div>
          <div className="subtitle">{subtitle}</div>

          {(embedUrl || isMP4) && (
            <div className="video-wrapper">
              {embedUrl && <iframe id="offer-video" src={embedUrl} allow="autoplay; fullscreen" allowFullScreen />}
              {isMP4 && <video id="offer-video-mp4" controls autoPlay src={videoUrl} />}
            </div>
          )}

          {paragraph && <div className="paragraph">{paragraph}</div>}

          <div className="reveal-content" id="reveal-content">
            {revealParagraph && <div className="reveal-paragraph">{revealParagraph}</div>}
          </div>

          {ctaDelaySeconds > 0 && (
            <div className="unlock-msg" id="unlock-msg">
              Your offer unlocks in <span id="cta-timer">{ctaDelaySeconds}</span> seconds...
            </div>
          )}

          <button className={`cta-btn${ctaDelaySeconds > 0 ? " hidden" : ""}`} id="cta-btn">
            {ctaText || "Yes! Add to my order"}
          </button>

          <button className="decline" id="decline-btn">{declineMessage}</button>
        </div>

        {isYouTube && <script src="https://www.youtube.com/iframe_api" />}

        <script dangerouslySetInnerHTML={{ __html: `
          var SHOP = "${shop}";
          var VARIANT_ID = "${numericVariantId}";
          var REVEAL_AT = ${Number(revealAtSeconds) || 0};
          var CTA_DELAY = ${Number(ctaDelaySeconds) || 0};
          var IS_YOUTUBE = ${isYouTube ? 'true' : 'false'};
          var revealed = false;
          var ctaUnlocked = ${ctaDelaySeconds > 0 ? 'false' : 'true'};

          // Countdown timer
          var cdSecs = ${countdownMin * 60};
          var cdEl = document.getElementById('countdown');
          if (cdEl) {
            setInterval(function() {
              if (cdSecs > 0) cdSecs--;
              var m = String(Math.floor(cdSecs / 60)).padStart(2, '0');
              var s = String(cdSecs % 60).padStart(2, '0');
              cdEl.textContent = m + ':' + s;
            }, 1000);
          }

          var ctaBtn = document.getElementById('cta-btn');
          var unlockMsg = document.getElementById('unlock-msg');
          var ctaTimer = document.getElementById('cta-timer');

          // CTA delay timer
          if (CTA_DELAY > 0 && ctaBtn) {
            var remaining = CTA_DELAY;
            var t = setInterval(function() {
              remaining--;
              if (ctaTimer) ctaTimer.textContent = remaining;
              if (remaining <= 0) {
                clearInterval(t);
                ctaUnlocked = true;
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
          }

          // YouTube API tracking
          var ytPlayer;
          window.onYouTubeIframeAPIReady = function() {
            ytPlayer = new YT.Player('offer-video', {
              events: {
                onReady: function(e) {
                  console.log('YouTube player ready, REVEAL_AT =', REVEAL_AT);
                  if (REVEAL_AT > 0) {
                    setInterval(function() {
                      var t = ytPlayer.getCurrentTime();
                      console.log('YT time:', t);
                      if (t >= REVEAL_AT) revealContent();
                    }, 500);
                  }
                },
                onStateChange: function(e) {
                  console.log('YT state:', e.data);
                }
              }
            });
          };

          // Fallback: if YouTube API doesn't load after 5 seconds, use a page timer
          if (IS_YOUTUBE && REVEAL_AT > 0) {
            setTimeout(function() {
              if (!ytPlayer) {
                console.log('YouTube API did not load, using fallback timer');
                setTimeout(revealContent, REVEAL_AT * 1000);
              }
            }, 5000);
          }

          // MP4 tracking
          var mp4Video = document.getElementById('offer-video-mp4');
          if (mp4Video && REVEAL_AT > 0) {
            mp4Video.addEventListener('timeupdate', function() {
              if (mp4Video.currentTime >= REVEAL_AT) revealContent();
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
        `}} />
      </body>
    </html>
  );
}