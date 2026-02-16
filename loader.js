(() => {

  const BRAND = "BNDA X JSON";
  const PHONE = "+92 300 1234567";
  const WHATSAPP = "https://wa.me/923038592702";
  const TELEGRAM = "https://t.me/BNDAXJSON";
  const TIKTOK = "https://www.tiktok.com/@bndadeveloper";

  const VALID_KEYS = ["BNDA-1111", "BNDA-2222"];

  const APP_URL = "https://YOURUSERNAME.github.io/bnda/app.js";

  if (window.__BNDA__) return;
  window.__BNDA__ = true;

  const overlay = document.createElement("div");
  overlay.style = `
    position:fixed;inset:0;background:rgba(0,0,0,.6);
    display:flex;align-items:center;justify-content:center;
    z-index:999999;font-family:sans-serif;
  `;

  overlay.innerHTML = `
    <div style="background:#0b1220;color:#fff;width:380px;padding:20px;border-radius:15px;">
      <h2 style="margin:0 0 10px 0;">${BRAND}</h2>
      <p style="font-size:13px;">Contact: ${PHONE}</p>

      <input id="license" placeholder="Enter license key"
        style="width:100%;padding:10px;margin-top:10px;border-radius:8px;border:none;"/>

      <button id="verify"
        style="width:100%;padding:10px;margin-top:10px;background:#1f2b4d;color:#fff;border:none;border-radius:8px;font-weight:bold;">
        Verify
      </button>

      <div id="msg" style="margin-top:10px;font-size:13px;"></div>

      <div style="display:flex;gap:5px;margin-top:15px;">
        <a href="${WHATSAPP}" target="_blank"
         style="flex:1;background:#111c34;padding:8px;text-align:center;border-radius:8px;color:#fff;text-decoration:none;">WhatsApp</a>

        <a href="${TELEGRAM}" target="_blank"
         style="flex:1;background:#111c34;padding:8px;text-align:center;border-radius:8px;color:#fff;text-decoration:none;">Telegram</a>

        <a href="${TIKTOK}" target="_blank"
         style="flex:1;background:#111c34;padding:8px;text-align:center;border-radius:8px;color:#fff;text-decoration:none;">TikTok</a>
      </div>

      <p style="margin-top:15px;font-size:12px;">Buy from original source</p>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("verify").onclick = async () => {
    const key = document.getElementById("license").value.trim();
    const msg = document.getElementById("msg");

    if (!VALID_KEYS.includes(key)) {
      msg.innerText = "Invalid License ❌";
      msg.style.color = "orange";
      return;
    }

    msg.innerText = "License OK ✅ Loading...";
    msg.style.color = "lightgreen";

    const s = document.createElement("script");
    s.src = APP_URL + "?t=" + Date.now();
    document.body.appendChild(s);

    setTimeout(() => overlay.remove(), 800);
  };

})();
