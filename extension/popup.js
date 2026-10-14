'use strict';
(async()=>{
 const status=document.getElementById('status');
 const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
 let url;try{url=new URL(tab.url);}catch(e){status.textContent='このページでは利用できません';return;}
 if(!['http:','https:'].includes(url.protocol)){status.textContent='HTTPS/HTTPページのみ対応';return;}
 const pattern=url.origin+'/*',key='allow:'+url.origin;
 const read=await chrome.storage.local.get(key);
 status.textContent=read[key]?'このサイトは有効です':'このサイトは無効です';
 document.getElementById('enable').onclick=async()=>{
   const granted=await chrome.permissions.request({origins:[pattern]});
   if(!granted){status.textContent='アクセス権が許可されませんでした';return;}
   await chrome.storage.local.set({[key]:true});
   await chrome.runtime.sendMessage({type:'TFA_INJECT',tabId:tab.id});
   status.textContent='有効化しました。ページ遷移後も適用されます';
 };
 document.getElementById('disable').onclick=async()=>{
   await chrome.storage.local.set({[key]:false});
   await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>{
     const state=window.__tabFocusAid_v3__;
     state?.restore?.();
   }}).catch(()=>{});
   status.textContent='無効化しました';
 };
})();
