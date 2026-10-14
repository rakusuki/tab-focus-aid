'use strict';
async function inject(tabId) {
  try {
    await chrome.scripting.executeScript({target:{tabId},files:['tab-focus-aid.js']});
    await chrome.scripting.executeScript({target:{tabId},func:()=>{
      const panel=document.querySelector('#tab-focus-aid-panel');
      const apply=panel?.shadowRoot?.getElementById('apply');
      if(apply && panel.style.display!=='none')apply.click();
    }});
  } catch(e) { console.warn('Tab Focus Aid injection skipped:',String(e)); }
}
chrome.tabs.onUpdated.addListener(async(tabId,info,tab)=>{
  if(info.status!=='complete'||!tab.url)return;
  try{
    const url=new URL(tab.url);
    if(!['http:','https:'].includes(url.protocol))return;
    const origin=url.origin+'/*';
    const key='allow:'+url.origin;
    const saved=await chrome.storage.local.get(key);
    if(!saved[key])return;
    if(!await chrome.permissions.contains({origins:[origin]}))return;
    await inject(tabId);
  }catch(e){console.warn('Tab Focus Aid onUpdated:',String(e));}
});
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(message?.type!=='TFA_INJECT')return;
  inject(message.tabId).then(()=>respond({ok:true}),e=>respond({ok:false,error:String(e)}));
  return true;
});
