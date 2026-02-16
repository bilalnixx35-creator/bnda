// ==UserScript==
// @name        BNDA Leaderboard Demo to live  + Auto Position 
// @namespace   BNDA
// @version     2.1
// @description Editable leaderboard with popup, auto-position, slider red on loss, live mode, per-user storage, leaderboard name/flag/amount editing
// @match       https://market-qx.trade/en/demo-trade
// @grant       none
// ==/UserScript==

(async function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  function safeNum(txt) { return Number((txt||'').replace(/[^0-9.-]/g,''))||0; }
  function money(n){ return "$"+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }

  // -----------------------
  // STORAGE KEYS & UID
  // -----------------------
  const KEY_LB = 'qx_lb_profile';
  const KEY_INIT = 'qx_initial_balance';
  const KEY_SLIDER = 'qx_expand_percent';
  const KEY_CUSTOM_POSITION = 'qx_custom_position';
  const UID = localStorage.getItem('qx_uid') || 'uid_'+Math.floor(Math.random()*900000+100000);
  const perUser = k => `qx_${UID}_${k}`;

  let initialBal = Number(localStorage.getItem(KEY_INIT)||0);
  let currentExpandPercent = Number(localStorage.getItem(KEY_SLIDER)||50);
  let lastProfitDiff = null;

  function formatAmount(n){ return "$"+(Number.isFinite(n)?n.toFixed(2):"0.00"); }
  function formatWithThousands(n){ return Number.isFinite(n)?n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):"0.00"; }

  // -----------------------
  // DEMO -> LIVE URL FIX
  // -----------------------
  if(location.href==="https://market-qx.trade/en/trade"){
    location.replace("https://market-qx.trade/en/demo-trade");
    return;
  }
  if(location.href==="https://market-qx.trade/en/demo-trade"){
    const fakeUrl="https://market-qx.trade/en/trade";
    const fakeTitle="Live trading | Quotex";
    document.title=fakeTitle;
    try{
      new MutationObserver(()=>{ if(document.title!==fakeTitle) document.title=fakeTitle; })
        .observe(document.querySelector('title'),{childList:true});
    }catch(e){}
    history.replaceState(null,"",fakeUrl);
  }

  // -----------------------
  // SELECTORS
  // -----------------------
  const selectors = {
    positionHeaderMoney: ".position__header-money.--green, .position__header-money.--red",
    usermenuBalance: ".---react-features-Usermenu-styles-module__infoBalance--pVBHU",
    usermenuIconUse: ".---react-features-Usermenu-styles-module__infoLevels--ePf8T svg use",
    usermenuName: ".---react-features-Usermenu-styles-module__infoName--SfrTV.---react-features-Usermenu-styles-module__demo--TmWTp",
    levelName: ".---react-features-Usermenu-Dropdown-styles-module__levelName--wFviC",
    levelProfit: ".---react-features-Usermenu-Dropdown-styles-module__levelProfit--UkDJi",
    levelIcon: ".---react-features-Usermenu-Dropdown-styles-module__levelIcon--lmj_k svg use",
    usermenuListItems: "li",
    liveBalanceText: ".---react-features-Usermenu-styles-module__infoText--58LeE .---react-features-Usermenu-styles-module__infoBalance--pVBHU",
    lbNameHeader: '.position__header-name',
    lbMoney: 'div[class*="LeaderBoard-Position-styles-module__money"]',
    expand: '.---react-features-Sidepanel-LeaderBoard-Position-styles-module__expand--KBHoM',
    footer: '.---react-features-Sidepanel-LeaderBoard-Position-styles-module__footer--iKtL6'
  };
  const activeClass='---react-features-Usermenu-Dropdown-styles-module__active--P5n2A';

  // -----------------------
  // LEADERBOARD POSITION POINTS
  // -----------------------
  const points = [
    { profit: 1, position: 58469 },
    { profit: 1000, position: 3154 },
    { profit: 5458, position: 124 },
    { profit: 20094, position: 21 },
    { profit: 25897, position: 1 },
  ];

  function interpolatePosition(profit){
    const customPos = Number(localStorage.getItem(KEY_CUSTOM_POSITION));
    if(customPos && customPos > 0) return customPos;

    if(profit <= points[0].profit) return points[0].position;
    if(profit >= points[points.length-1].profit) return points[points.length-1].position;
    for(let i=0;i<points.length-1;i++){
      const p1 = points[i];
      const p2 = points[i+1];
      if(profit >= p1.profit && profit <= p2.profit){
        const slope = (p2.position - p1.position)/(p2.profit - p1.profit);
        return Math.round(slope*(profit - p1.profit) + p1.position);
      }
    }
    return points[0].position;
  }

  // -----------------------
  // LIVE MODE ACTIVATION
  // -----------------------
  function activateLiveMode(){
    try{
      if(document.title.includes("Demo")) document.title=document.title.replace(/Demo/gi,"Live");
      const listItems = $$(selectors.usermenuListItems || "li");
      if(!listItems.length) return;
      const demoLi = listItems.find(li=>/demo/i.test(li.innerText));
      const liveLi = listItems.find(li=>/\blive\b/i.test(li.innerText));
      if(!demoLi || !liveLi) return;
      const demoBalanceElem = demoLi.querySelector("b");
      const liveBalanceElem = liveLi.querySelector("b");
      if(!demoBalanceElem || !liveBalanceElem) return;
      demoBalanceElem.textContent = formatAmount(10000);
      const liveBalanceValue = safeNum($(selectors.liveBalanceText)?.textContent)||0;
      liveBalanceElem.textContent = formatAmount(liveBalanceValue);
      demoLi.classList.remove(activeClass);
      liveLi.classList.add(activeClass);
      try{ localStorage.setItem(perUser('marketMode'),'live'); }catch(e){}
    }catch(e){}
  }

  // -----------------------
  // UPDATE POSITION & UI
  // -----------------------
  function updatePositionExpandOnProfitChange(){
    try{
      const bal=safeNum($(selectors.usermenuBalance)?.textContent);
      if(isNaN(bal)) return;
      const diff = bal-initialBal;
      if(diff!==lastProfitDiff){
        currentExpandPercent = Math.floor(Math.random()*91)+10;
        lastProfitDiff=diff;
        try{ localStorage.setItem(perUser('expandPercent'),String(currentExpandPercent)); }catch(e){}
      }
      const expandSpan = document.querySelector(".position__loading .position__expand");
      if(expandSpan) expandSpan.style.width = currentExpandPercent+"%";
    }catch(e){}
  }

  function updateHeaderAndFooter(){
    const bal = safeNum($(selectors.usermenuBalance)?.textContent);
    const profitEl = $(selectors.positionHeaderMoney);
    if(!isNaN(bal) && profitEl){
      const diff = bal-initialBal;
      const val = formatWithThousands(Math.abs(diff||0));
      profitEl.innerText = diff===0?"$0.00":(diff>0?`$${val}`:`-$${val}`);
      profitEl.style.color = diff<0?"#ff3e3e":"#0faf59";
    }

    // UPDATE LEADERBOARD HEADER
    const data = JSON.parse(localStorage.getItem(KEY_LB)||'{}');
    if(data.name && data.flag){
      $$(selectors.lbNameHeader).forEach(box=>{
        box.innerHTML = `<svg width="18" height="12" style="margin-right:4px;"><use xlink:href="/profile/images/flags.svg#flag-${data.flag}"></use></svg><span>${data.name}</span>`;
      });
    }

    // UPDATE FOOTER
    const lbEl = $(selectors.lbMoney);
    const expandEl = $(selectors.expand);
    if(lbEl){
      const diff = bal-initialBal;
      lbEl.textContent = diff===0?'$0.00':(diff>0?money(diff):'-'+money(diff));
      lbEl.style.color = diff<0?'#ff3e3e':'#0faf59';
      if(expandEl) expandEl.style.width = currentExpandPercent+'%';

      const footer = $(selectors.footer);
      if(footer){
        footer.innerHTML='';
        const label = document.createElement('span');
        label.textContent="Your position: ";
        label.style.color="#e0e0e0";
        footer.appendChild(label);

        const span = document.createElement('span');
        span.className='auto-position-span';
        span.textContent = interpolatePosition(diff);
        span.style.color='#fff';
        span.style.fontWeight='bold';
        span.style.marginLeft='5px';
        footer.appendChild(span);
      }
    }

    updatePositionExpandOnProfitChange();
  }

  // -----------------------
  // LEVEL ICON & INFO UPDATE
  // -----------------------
  function updateLevelInfo(){
    try{
      const bal=safeNum($(selectors.usermenuBalance)?.textContent);
      let levelType='standart';
      if(!isNaN(bal)){
        if(bal>9999.99) levelType='vip';
        else if(bal>4999.99) levelType='pro';
      }
      const iconHref=`/profile/images/spritemap.svg#icon-profile-level-${levelType}`;
      $(selectors.usermenuIconUse)?.setAttribute("xlink:href",iconHref);
      $(selectors.levelIcon)?.setAttribute("xlink:href",iconHref);
      const nameEl = $(selectors.usermenuName);
      if(nameEl){ nameEl.textContent="Live"; nameEl.style.color="#0faf59"; }
      const levelNameElem = $(selectors.levelName);
      const levelProfitElem = $(selectors.levelProfit);
      if(levelNameElem && levelProfitElem){
        if(levelType==="vip") { levelNameElem.textContent="vip:"; levelProfitElem.textContent="+4% profit"; }
        else if(levelType==="pro") { levelNameElem.textContent="pro:"; levelProfitElem.textContent="+2% profit"; }
        else { levelNameElem.textContent="standard:"; levelProfitElem.textContent="+0% profit"; }
      }
    }catch(e){}
  }

  // -----------------------
  // LEADERBOARD EDIT POPUP
  // -----------------------
  function createLeaderboardPopup() {
    if ($('#qx-leaderboard-popup')) return $('#qx-leaderboard-popup');

    const popupWrap = document.createElement('div');
    popupWrap.id = 'qx-leaderboard-popup';
    popupWrap.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);z-index:999999;';

    const saved = JSON.parse(localStorage.getItem(KEY_LB)||'{}');
    const savedCustomPos = localStorage.getItem(KEY_CUSTOM_POSITION) || '';

    popupWrap.innerHTML = `
      <div style="width:470px;padding:25px;background:#1b1b2d;border-radius:15px;color:#fff;font-family:sans-serif;box-shadow:0 0 20px rgba(0,0,0,0.7);">
        <h2 style="text-align:center;margin-bottom:10px;">BNDA Leaderboard Edit</h2>
        <p style="text-align:center;font-size:13px;color:#aaa;margin-bottom:20px;">Edit your leaderboard info</p>
        
        <label>👤 Name</label>
        <input id="lb-name" placeholder="Enter name" value="${saved.name||''}" style="width:100%;margin-bottom:10px;padding:8px;border-radius:6px;border:none;background:#2c2c44;color:#fff;" />

        <label>🚩 Flag code</label>
        <input id="lb-flag" placeholder="e.g. bd" value="${saved.flag||''}" style="width:100%;margin-bottom:10px;padding:8px;border-radius:6px;border:none;background:#2c2c44;color:#fff;" />

        <label>🏆 Leaderboard amount</label>
        <input id="lb-amount" type="number" placeholder="Enter amount" value="${saved.amount||0}" style="width:100%;margin-bottom:10px;padding:8px;border-radius:6px;border:none;background:#2c2c44;color:#fff;" />

        <label>📍 Custom Position (optional)</label>
        <input id="lb-custom-position" type="number" placeholder="Enter custom position" value="${savedCustomPos}" style="width:100%;margin-bottom:10px;padding:8px;border-radius:6px;border:none;background:#2c2c44;color:#fff;" />

        <label>💸 Capital %</label>
        <input id="lb-slider" type="range" min="0" max="100" value="${currentExpandPercent}" style="width:100%;margin-bottom:5px;" />
        <div style="text-align:right;margin-bottom:15px;" id="lb-slider-val">${currentExpandPercent}%</div>

        <div style="display:flex;gap:10px;">
          <button id="lb-confirm" style="flex:1;background:#0faf59;color:#fff;padding:10px;border-radius:6px;font-weight:bold;">Save</button>
          <button id="lb-cancel" style="flex:1;background:#888;color:#fff;padding:10px;border-radius:6px;font-weight:bold;">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(popupWrap);

    const slider = popupWrap.querySelector('#lb-slider');
    const sliderVal = popupWrap.querySelector('#lb-slider-val');
    slider?.addEventListener('input', ()=>{
      sliderVal.textContent = slider.value + "%";
      currentExpandPercent = Number(slider.value);
      const expandEl = $(selectors.expand);
      if(expandEl) expandEl.style.width = currentExpandPercent + '%';
    });

    popupWrap.querySelector('#lb-cancel')?.addEventListener('click', ()=>popupWrap.remove());

    popupWrap.querySelector('#lb-confirm')?.addEventListener('click', ()=>{
      try {
        const name = popupWrap.querySelector('#lb-name').value.trim();
        const flag = popupWrap.querySelector('#lb-flag').value.trim().toLowerCase();
        const lbAmount = Number(popupWrap.querySelector('#lb-amount').value);
        const customPos = Number(popupWrap.querySelector('#lb-custom-position').value);
        const ub = safeNum($(selectors.usermenuBalance)?.textContent) || 0;

        if(!name || !flag) return alert('Enter name and flag');
        if(!Number.isFinite(lbAmount) || lbAmount<0) return alert('Enter valid amount');
        if(lbAmount>ub) return alert('Leaderboard amount exceeds balance');

        initialBal = ub - lbAmount;
        localStorage.setItem(KEY_INIT, initialBal);
        localStorage.setItem(KEY_LB, JSON.stringify({name,flag,amount:lbAmount}));
        localStorage.setItem(KEY_SLIDER, currentExpandPercent);

        if(Number.isFinite(customPos) && customPos>0){
          localStorage.setItem(KEY_CUSTOM_POSITION, customPos);
        } else {
          localStorage.removeItem(KEY_CUSTOM_POSITION);
        }

        updateHeaderAndFooter();
        popupWrap.remove();
      } catch(e){console.error(e);}
    });

    return popupWrap;
  }

  // OPEN POPUP ON CLICKING "Edit Leaderboard" (or deposit links)
  document.addEventListener('click', e=>{
    const t = e.target.closest('a,button');
    if(!t) return;
    if(/deposit/i.test(t.textContent||'')) {
      e.preventDefault();
      createLeaderboardPopup();
    }
  }, true);

  // -----------------------
  // OBSERVER
  // -----------------------
  const observer = new MutationObserver(()=>{
    observer.disconnect();
    updateHeaderAndFooter();
    updateLevelInfo();
    observer.observe(document.body,{childList:true,subtree:true});
  });
  observer.observe(document.body,{childList:true,subtree:true});

  // -----------------------
  // BOOT
  // -----------------------
  function boot(){
    activateLiveMode();
    updateHeaderAndFooter();
    updateLevelInfo();
    function loop(){
      activateLiveMode();
      updateHeaderAndFooter();
      updateLevelInfo();
      requestAnimationFrame(loop);
    }
    loop();
  }

  boot();

})();
