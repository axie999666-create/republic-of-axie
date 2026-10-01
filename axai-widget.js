(() => {
  const base = new URL('.', document.currentScript.src);
  const endpoint = window.AXAI_CONFIG?.endpoint || '';
  const root = document.createElement('div'); document.body.append(root);
  const ui = root.attachShadow({mode:'open'});
  ui.innerHTML = `<style>
  *{box-sizing:border-box}button,input{font:inherit}button{cursor:pointer}button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid #58cafa;outline-offset:2px}
  :host{font:15px/1.6 system-ui,sans-serif;color:#e8f1ff} .launch{position:fixed;right:22px;bottom:22px;z-index:9999;border:1px solid #7dc7ff;border-radius:30px;background:#123d65;color:white;padding:13px 22px;box-shadow:0 8px 25px #0006}
  .panel{position:fixed;right:22px;bottom:86px;z-index:9999;width:min(390px,calc(100vw - 24px));height:min(580px,calc(100dvh - 110px));background:#102a44;border:1px solid #537899;border-radius:18px;box-shadow:0 16px 50px #0008;display:flex;flex-direction:column;overflow:hidden}.panel[hidden]{display:none}
  header{padding:16px;background:#163b5c;display:flex;align-items:center;justify-content:space-between}header small{display:block;color:#a6d9ff} .close{background:none;border:0;color:white;font-size:24px}.messages{flex:1;overflow:auto;padding:15px}.msg{white-space:pre-wrap;background:#1b3d5b;border-radius:12px;padding:12px;margin-bottom:12px;overflow-wrap:anywhere}.user{background:#245a7b;margin-left:32px}a{display:block;color:#9bddff;margin-top:8px}.quick{display:flex;flex-wrap:wrap;gap:6px;padding:0 15px 12px}.quick button{border:1px solid #537899;background:#163b5c;color:white;border-radius:20px;padding:5px 10px;font-size:12px}form{display:flex;gap:8px;padding:12px;border-top:1px solid #537899}input{min-width:0;flex:1;border:1px solid #537899;border-radius:8px;background:#0b1c2d;color:white;padding:9px}form button{background:#82d2ff;color:#102a44;border:0;border-radius:8px;padding:8px 12px}button:disabled{opacity:.5;cursor:wait}
  </style><button class="launch" aria-expanded="false" aria-controls="axai-panel">🤖 AXAI</button><section id="axai-panel" class="panel" hidden aria-label="AXAI 阿谢国公共信息助手"><header><div><strong>AXAI</strong><small>${endpoint?'AI 问答 · 网页读取':'官方资料检索模式'}</small></div><button class="close" aria-label="关闭助手">×</button></header><div class="messages" role="log" aria-live="polite"></div><div class="quick"></div><div class="status" role="status" aria-live="polite" style="padding:0 15px;color:#a6d9ff;font-size:12px"></div><form><input aria-label="输入问题" placeholder="输入问题或 HTTPS 网页网址…" maxlength="500" required><button>发送</button></form></section>`;
  const $ = s => ui.querySelector(s), panel=$('.panel'), launch=$('.launch'), input=$('input'), form=$('form');
  function toggle(open){panel.hidden=!open;launch.setAttribute('aria-expanded',String(open));(open?input:launch).focus()}
  launch.onclick=()=>toggle(panel.hidden);$('.close').onclick=()=>toggle(false);ui.addEventListener('keydown',e=>{if(e.key==='Escape')toggle(false)});
  function message(text,sources=[],user=false){const div=document.createElement('div');div.className='msg'+(user?' user':'');div.textContent=text;for(const s of sources){let label;if(!s.url){label=document.createElement('span');label.style.cssText='display:block;color:#9bddff;margin-top:8px';}else{try{const url=new URL(s.url);if(url.protocol!=='https:')continue;label=document.createElement('a');label.href=url.href;label.target='_blank';label.rel='noopener noreferrer';}catch{continue}}label.textContent='来源：'+s.title;div.append(label);if(s.fetchedAt){const time=new Date(s.fetchedAt);if(!Number.isNaN(time.valueOf())){const note=document.createElement('small');note.style.cssText='display:block;color:#a6d9ff';note.textContent='读取时间：'+time.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})+'（北京时间）';div.append(note)}}}$('.messages').append(div);div.scrollIntoView({block:'nearest'});}
  message('你好，我是 AXAI，阿谢国公共信息助手。我可以帮助你查询宪法、刑法、总统法、国家资料和官方网站入口，也能简短回答其他问题。阿谢国资料不足时会明确说明。也可以读取相关官网，或你贴来的 HTTPS 公开网页。请勿输入个人敏感信息。');
  const knowledge=fetch(new URL('axai-knowledge.json',base),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error();return r.json()});knowledge.catch(()=>{});
function retrieve(q, knowledge) {
  const lawNames = ['总统法', '刑法', '宪法'];
  const laws = lawNames.filter(law => q.includes(law));
  const toNumber = value => {
    if (/^\d+$/.test(value)) return Number(value);
    const digits = {'零':0,'〇':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};
    let total=0, digit=0;
    for (const ch of value) {
      if (ch === '百' || ch === '十') { total += (digit || 1)*(ch === '百'?100:10); digit=0; }
      else if (Object.hasOwn(digits,ch)) digit=digits[ch]; else return NaN;
    }
    return total+digit;
  };
  const articleMatches = [...q.matchAll(/第?([0-9一二两三四五六七八九十百零〇]+)条(之[一二三四五六七八九十]+)?/g)];
  const exact = d => articleMatches.some(m => {
    const titleArticle = (d.article || d.title).match(/第([一二三四五六七八九十百零〇]+)条(之[一二三四五六七八九十]+)?/);
    return titleArticle && toNumber(titleArticle[1]) === toNumber(m[1]) && (titleArticle[2]||'')===(m[2]||'');
  });
  let query = q;
  for (const law of lawNames) query=query.replaceAll(law,'');
  query=query.replace(/第?[0-9一二两三四五六七八九十百零〇]+条(?:之[一二三四五六七八九十]+)?/g,'');
  const grams=[...new Set(Array.from({length:Math.max(0,query.length-1)},(_,i)=>query.slice(i,i+2)))];
  const pool=knowledge.filter(d => !laws.length || laws.includes(d.law) || d.conflictNote);
  const scored=pool.map(d=>({d,score:
    grams.reduce((s,g)=>s+(d.text.includes(g)?1:0)+(d.title.includes(g)?3:0),0)
    +d.keywords.filter(k=>!lawNames.includes(k)).reduce((s,k)=>s+(query.includes(k)?5:0),0)
    +(articleMatches.length && exact(d)?1000:0)
  })).filter(x=>articleMatches.length ? exact(x.d) : x.score>=3).sort((a,b)=>b.score-a.score);
  let docs=scored.slice(0,4).map(x=>x.d);
  if (!articleMatches.length && laws.length && !query.trim()) {const overview=pool.filter(d=>d.law && !d.article);docs=(overview.length?overview:pool).slice(0,4);}
  if (docs.some(d=>d.conflictNote || (d.law==='总统法' && [3,71,72].includes(d.articleNumber)))) {
    const extra=knowledge.filter(d=>d.conflictNote || (d.law==='宪法' && ['第三十七条','第六十二条'].includes(d.article)));
    docs=[...new Set([...docs.slice(0,3),...extra])];
  }
  return docs;
}

  let busy=false;
  async function ask(q){q=q.trim();if(!q||busy)return;busy=true;form.querySelector('button').disabled=true;$('.status').textContent='正在回答；涉及网页时会先读取内容…';message(q,[],true);input.value='';try{if(endpoint){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),60000);let r;try{r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q}),signal:controller.signal})}finally{clearTimeout(timer)}const data=await r.json();if(!r.ok)throw Error(data.error||'服务暂时不可用');if(typeof data.answer!=='string')throw Error();message(data.answer+(data.warnings?.length?'\n\n未能读取的网页：\n'+data.warnings.map(w=>w.url+'：'+w.message).join('\n'):''),data.sources||[])}else{const hits=retrieve(q,await knowledge);message(hits.length?'以下是相关官方资料摘录（收录于 2026-10-01）：\n\n'+hits.map(d=>d.text).join('\n\n'):'目前已接入的官方资料中没有找到这一信息，因此我无法确认。可到官方网站目录查找。',hits.length?hits:[{title:'官方网站目录',url:'https://directory.republic-of-axie.org/'}])}}catch(e){message(e.name==='AbortError'?'本次读取或回答超时，请稍后重试。':e.message&&e.message!=='Failed to fetch'?e.message:'服务暂时不可用，请稍后重试，或直接查看官方网站。',[{title:'阿谢国官方网站',url:'https://republic-of-axie.org/'}])}finally{busy=false;$('.status').textContent='';form.querySelector('button').disabled=false;}}
  for(const q of ['国家基本资料','查询法律','政府机构','最新新闻','查询投票','网站导航']){const b=document.createElement('button');b.type='button';b.textContent=q;b.onclick=()=>ask(q);$('.quick').append(b)}const readButton=document.createElement('button');readButton.type='button';readButton.textContent='读取网页';readButton.onclick=()=>{input.value='请读取并总结 ';input.focus()};$('.quick').append(readButton);form.onsubmit=e=>{e.preventDefault();ask(input.value)};
})();
