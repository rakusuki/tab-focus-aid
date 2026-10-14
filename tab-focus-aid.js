/* Tab Focus Aid v0.3.0 — MIT License. Runs locally, no network calls. */
(() => {
  'use strict';
  const KEY = '__tabFocusAid_v3__';
  if (window[KEY]) { window[KEY].open(); return; }
  const native = 'a[href],area[href],button,input,select,textarea,summary,iframe,[contenteditable=""],[contenteditable="true"]';
  const hints = '[onclick],[onmousedown],[onmouseup],[role="button"],[role="link"],[role="menuitem"],[role="tab"],[data-tt-click-send],[data-action],[data-click],.access-link';
  const records = new Map(), candidates = new Map();
  let nextId = 1, observer, closed = false, pending = false, filter = '';
  let priorFocus = document.activeElement;
  const host = document.createElement('div');
  host.id = 'tab-focus-aid-panel';
  host.style.cssText = 'all:initial!important;position:fixed!important;top:16px!important;right:16px!important;z-index:2147483647!important;';
  const shadow = host.attachShadow({mode:'open'});
  shadow.innerHTML = `<style>
    :host{all:initial} *{box-sizing:border-box}
    .panel{width:min(440px,calc(100vw - 32px));max-height:85vh;display:flex;flex-direction:column;background:#fff;color:#172033;font:14px/1.45 system-ui,sans-serif;border:2px solid #315eae;border-radius:10px;box-shadow:0 8px 32px #0005}
    header{display:flex;align-items:center;gap:8px;padding:12px 14px;background:#1d3f79;color:white;border-radius:8px 8px 0 0}
    h2{font-size:16px;margin:0;flex:1}button{cursor:pointer;font:inherit}
    header button{background:#fff;color:#163767;border:0;border-radius:5px;padding:3px 8px}
    .tools{padding:10px;display:flex;flex-wrap:wrap;gap:6px;border-bottom:1px solid #ddd}
    .tools input{width:100%;padding:7px;border:1px solid #888;border-radius:4px;font:inherit}
    .tools button,.footer button{padding:5px 9px;border:1px solid #5176ad;background:#f5f8ff;border-radius:5px;color:#123}
    #count{padding:7px 12px;color:#42526b}
    .items{overflow:auto;min-height:90px;max-height:49vh;list-style:none;margin:0;padding:0}
    li{display:flex;align-items:center;gap:7px;padding:7px 10px;border-top:1px solid #eee}
    li label{flex:1;min-width:0;cursor:pointer}
    .name{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
    .detail{display:block;color:#555;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    li button{font-size:12px;background:white;border:1px solid #bbb;border-radius:4px;padding:4px}
    .footer{display:flex;gap:6px;flex-wrap:wrap;padding:10px;border-top:1px solid #ddd}
    .footer button.primary{background:#164c99;color:#fff;border-color:#164c99}
    .note{margin:0;padding:0 12px 11px;color:#555;font-size:11px}
  </style><section class="panel" role="dialog" aria-label="Tab Focus Aid 候補管理">
    <header><h2>Tab Focus Aid</h2><button id="close" title="パネルを閉じる">×</button></header>
    <div class="tools"><input id="search" type="search" placeholder="要素名・CSS・根拠で絞り込み" aria-label="候補の検索"/>
    <button id="all">表示中を選択</button><button id="none">表示中を除外</button><button id="rescan">再検出</button></div>
    <div id="count" aria-live="polite"></div><ul class="items" id="items"></ul>
    <div class="footer"><button class="primary" id="apply">選択を反映</button><button id="restore">すべて元に戻す</button><button id="dismiss">閉じる</button></div>
    <p class="note">候補は推定結果です。選択後に「選択を反映」。Enter / Space（button相当）の操作を補助します。外部送信なし。</p>
  </section>`;
  const $ = id => shadow.getElementById(id);
  function inPanel(el) { return el === host || host.contains(el); }
  function visible(el) {
    if (!(el instanceof HTMLElement) || !el.isConnected || inPanel(el)) return false;
    if (el.closest('[hidden],[inert],[aria-hidden="true"]')) return false;
    const st = getComputedStyle(el);
    return st.display !== 'none' && st.visibility === 'visible' && el.getClientRects().length > 0;
  }
  function reason(el) {
    if (el.matches(hints)) return '属性 / role / クラス';
    if (getComputedStyle(el).cursor === 'pointer') return 'cursor:pointer（推定）';
    return '';
  }
  function qualified(el) {
    if (!visible(el) || el.matches(native+', [disabled], [aria-disabled="true"], :disabled')) return false;
    if (el.closest('a[href],button,input,select,textarea,[contenteditable]')) return false;
    if (el.hasAttribute('tabindex') && Number(el.getAttribute('tabindex')) >= 0) return false;
    const why = reason(el);
    if (!why) return false;
    if (why.startsWith('cursor')) {
      if (el.matches('html,body,main,article,section,header,footer,nav,ul,ol,li,table,tr,td,form')) return false;
      const b = el.getBoundingClientRect();
      if (b.width > innerWidth * .85 && b.height > innerHeight * .6) return false;
    }
    return true;
  }
  function describe(el) {
    return (el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || el.textContent || el.className || el.tagName)
      .replace(/\s+/g,' ').trim().slice(0,100) || el.tagName.toLowerCase();
  }
  function scan() {
    if (closed) return;
    document.querySelectorAll('*').forEach(el => {
      if (candidates.has(el) || !qualified(el)) return;
      candidates.set(el,{id:nextId++,selected:true,why:reason(el)});
    });
    render();
  }
  function rollback(el) {
    const r = records.get(el);
    if (!r) return;
    el.removeEventListener('keydown',r.keydown);
    for (const [attr,val] of Object.entries(r.attrs)) {
      if (val === null) el.removeAttribute(attr); else el.setAttribute(attr,val);
    }
    records.delete(el);
  }
  function activate(el) {
    if (records.has(el) || !el.isConnected) return;
    const attrs = {};
    for (const a of ['tabindex','role','data-tab-focus-aid']) attrs[a] = el.getAttribute(a);
    el.setAttribute('tabindex','0');
    if (!el.hasAttribute('role')) el.setAttribute('role','button');
    el.setAttribute('data-tab-focus-aid','1');
    const keydown = e => {
      if (e.target !== el || e.defaultPrevented || e.repeat || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
      const isLink = el.getAttribute('role') === 'link';
      if (e.key === 'Enter' || (e.key === ' ' && !isLink)) {
        e.preventDefault();
        // Do not stop propagation: some frameworks attach delegated keyboard listeners.
        el.click();
      }
    };
    el.addEventListener('keydown',keydown);
    records.set(el,{attrs,keydown});
  }
  function apply() {
    for (const [el,item] of candidates) {
      if (!el.isConnected) { rollback(el); candidates.delete(el); continue; }
      if (item.selected) activate(el); else rollback(el);
    }
    render();
    hidePanel();
  }
  function escapeText(el,text) { el.textContent = text; }
  function diagnosticData(el,item){
    const css=getComputedStyle(el),rect=el.getBoundingClientRect();
    const ancestors=[];let a=el.parentElement;
    for(let i=0;i<4&&a;i++,a=a.parentElement)ancestors.push(a.tagName.toLowerCase());
    return {tool:'Tab Focus Aid',version:'0.3.0',privacy:'No text, HTML, URLs, IDs, classes, or input values collected',
      element:{tag:el.tagName.toLowerCase(),ancestorTags:ancestors,
        attributePresent:{onclick:el.hasAttribute('onclick'),dataAction:el.hasAttribute('data-action'),dataClick:el.hasAttribute('data-click'),dataTtClickSend:el.hasAttribute('data-tt-click-send'),ariaLabel:el.hasAttribute('aria-label')},
        role:['button','link','tab','menuitem'].includes(el.getAttribute('role'))?el.getAttribute('role'):(el.hasAttribute('role')?'[other]':null),
        tabindexAttribute:el.getAttribute('tabindex'),tabIndexProperty:el.tabIndex,
        focused:document.activeElement===el,applied:records.has(el),selected:item.selected,detectionReason:item.why,
        style:{display:css.display,visibility:css.visibility,cursor:css.cursor,outlineStyle:css.outlineStyle,outlineWidth:css.outlineWidth,outlineOffset:css.outlineOffset,overflow:css.overflow,opacity:css.opacity},
        sizePx:{width:Math.round(rect.width),height:Math.round(rect.height)}},
      environment:{chromeBased:navigator.userAgent.includes('Chrome/'),insideIframe:window.top!==window.self},
      note:'Review this report and any screenshot before sharing publicly.'};
  }
  async function copyDiagnostic(el,item){
    const report=JSON.stringify(diagnosticData(el,item),null,2);
    try{
      if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(report);
      else {
        const t=document.createElement('textarea');t.value=report;t.style.cssText='position:fixed;left:-9999px';
        document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();
        if(!ok)throw new Error('Clipboard unavailable');
      }
      $('count').textContent='診断レポートをコピーしました。内容を確認して共有してください。';
    }catch(e){window.prompt('診断レポートを手動でコピーしてください。',report);}
  }
  function render() {
    if (closed) return;
    const items = $('items');
    const shown = [...candidates].filter(([el,c]) => el.isConnected && (describe(el)+' '+el.tagName+' '+el.className+' '+c.why).toLowerCase().includes(filter));
    escapeText($('count'),`${candidates.size} 候補 / ${[...candidates.values()].filter(c=>c.selected).length} 選択 / ${records.size} 有効`);
    items.replaceChildren();
    for (const [el,c] of shown.slice(0,400)) {
      const li = document.createElement('li'), box = document.createElement('input'), label = document.createElement('label'), nm = document.createElement('span'), meta = document.createElement('span'), go = document.createElement('button'), diagnostic = document.createElement('button');
      box.type='checkbox';box.id='tfa-'+c.id;box.checked=c.selected;
      box.onchange=()=>{c.selected=box.checked; renderCount();};
      label.htmlFor=box.id;nm.className='name';meta.className='detail';
      nm.textContent=describe(el);
      meta.textContent=`${el.tagName.toLowerCase()} · ${c.why}${records.has(el)?' · 有効':''}`;
      label.append(nm,meta);go.type='button';go.textContent='位置';
      go.title='候補の場所までスクロール';go.onclick=()=>{el.scrollIntoView({block:'center',behavior:'smooth'});el.style.outline='3px solid orange';setTimeout(()=>{el.style.removeProperty('outline');},1300);};
      diagnostic.type='button';diagnostic.textContent='診断コピー';diagnostic.title='機密情報を除外した診断情報をコピー';diagnostic.onclick=()=>copyDiagnostic(el,c);li.append(box,label,go,diagnostic);items.append(li);
    }
    if (shown.length > 400) {const li=document.createElement('li');li.textContent='先頭400件を表示中。検索して絞り込んでください。';items.append(li);}
  }
  function renderCount(){escapeText($('count'),`${candidates.size} 候補 / ${[...candidates.values()].filter(c=>c.selected).length} 選択 / ${records.size} 有効`);}
  function hidePanel() {
    host.style.setProperty('display', 'none', 'important');
    const fallback = [...records.keys()].find(el => el.isConnected);
    const destination = priorFocus && priorFocus.isConnected && priorFocus !== host
      ? priorFocus : fallback;
    if (destination && typeof destination.focus === 'function') {
      destination.focus({preventScroll:true});
    } else if (shadow.activeElement) {
      shadow.activeElement.blur();
    }
  }
  function showPanel() {
    priorFocus = document.activeElement;
    host.style.setProperty('display', 'block', 'important');
    render();
  }

  // An invisible or narrow click overlay can have a focus outline only a few
  // pixels high. Highlight its visible service card while keeping focus on
  // the actual keyboard-activated element.
  let highlighted = null;
  function clearHighlight() {
    if (highlighted) highlighted.removeAttribute('data-tab-focus-aid-highlight');
    highlighted = null;
  }
  function focusVisualTarget(el) {
    const serviceCard = el.closest('.eventhub-service');
    if (serviceCard) {
      const card = serviceCard.querySelector('.card-default') || serviceCard;
      if (card.getClientRects().length) return card;
    }
    const own = el.getBoundingClientRect();
    if (own.width >= 24 && own.height >= 16) return el;
    for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      const box = parent.getBoundingClientRect();
      if (box.width >= 48 && box.height >= 24 && box.width <= innerWidth * 0.95) return parent;
    }
    return el;
  }
  function onFocusIn(event) {
    clearHighlight();
    const el = event.target;
    if (!records.has(el)) return;
    const target = focusVisualTarget(el);
    if (target !== el) {
      target.setAttribute('data-tab-focus-aid-highlight','1');
      highlighted = target;
    }
  }
  function onFocusOut() {
    clearHighlight();
  }
  function restore() {
    closed=true;observer?.disconnect();
    document.removeEventListener('focusin',onFocusIn,true);
    document.removeEventListener('focusout',onFocusOut,true);
    clearHighlight();
    for(const el of [...records.keys()]) rollback(el);
    style.remove();host.remove();delete window[KEY];
  }
  const style=document.createElement('style');
  style.textContent='[data-tab-focus-aid="1"]:focus-visible{outline:3px solid #1677ff!important;outline-offset:3px!important}[data-tab-focus-aid-highlight="1"]{outline:3px solid #1677ff!important;outline-offset:3px!important}';
  document.head.append(style);document.documentElement.append(host);
  document.addEventListener('focusin',onFocusIn,true);
  document.addEventListener('focusout',onFocusOut,true);
  $('close').onclick=$('dismiss').onclick=hidePanel;
  $('search').oninput=e=>{filter=e.target.value.toLowerCase();render();};
  $('all').onclick=()=>{for(const [el,c] of candidates) if ((describe(el)+' '+el.tagName+' '+el.className+' '+c.why).toLowerCase().includes(filter))c.selected=true;render();};
  $('none').onclick=()=>{for(const [el,c] of candidates) if ((describe(el)+' '+el.tagName+' '+el.className+' '+c.why).toLowerCase().includes(filter))c.selected=false;render();};
  $('rescan').onclick=scan;$('apply').onclick=apply;$('restore').onclick=restore;
  window[KEY]={open:showPanel,restore};
  observer=new MutationObserver(mutations => {
    if (mutations.every(m => inPanel(m.target))) return;
    if(pending||closed)return;pending=true;
    setTimeout(()=>{pending=false;scan();},350);
  });
  observer.observe(document.body,{childList:true,subtree:true});
  scan();
})();