(() => {
  const base = new URL('.', document.currentScript.src);
  const endpoint = window.AXAI_CONFIG?.endpoint || '';
  const uiStrings = {
    'zh-Hans': {
      panel: 'AXAI 阿谢国公共信息助手', close: '关闭助手', input: '输入问题', placeholder: '输入问题或 HTTPS 网页网址…', send: '发送',
      online: 'AI 问答 · 网页读取', local: '官方资料检索模式', tryOnline: '再试在线 AI', localButton: '本地资料检索',
      statusLocal: '正在检索已收录资料…', statusOnline: '正在回答；连接不畅时可点击“本地资料检索”…',
      welcome: '你好，我是 AXAI，阿谢国公共信息助手。我可以帮助你查询宪法、刑法、总统法、国家资料和官方网站入口，也能简短回答其他问题。阿谢国资料不足时会明确说明。也可以读取相关官网，或你贴来的 HTTPS 公开网页。请勿输入个人敏感信息。',
      source: '来源：', readAt: '读取时间：', beijing: '（北京时间）', warning: '未能读取的网页：',
      localNotice: '以下是已收录的官方资料摘录。', noDate: '资料未标注收录日期。', date: '资料收录日期：',
      liveUnavailable: '本地资料检索无法读取网页或确认最新新闻、投票状态，请直接查看对应官方网站。',
      noResult: '已收录的官方资料中没有找到相关信息，无法确认。请查看官方网站目录。',
      fallbackNotice: '已切换到本地官方资料检索，当前无法提供在线 AI 问答或实时网页读取。',
      failure: '在线服务和本地资料暂时不可用，请稍后重试或直接查看官方网站。', directory: '官方网站目录', site: '阿谢国官方网站',
      quick: [['国家基本资料','国家基本资料'],['查询法律','查询法律'],['政府机构','政府机构'],['最新新闻','最新新闻'],['查询投票','查询投票'],['网站导航','网站导航']],
      readWeb: '读取网页', readPrefix: '请读取并总结 '
    },
    'zh-Hant': {
      panel: 'AXAI 阿謝國公共資訊助手', close: '關閉助手', input: '輸入問題', placeholder: '輸入問題或 HTTPS 網頁網址…', send: '傳送',
      online: 'AI 問答 · 網頁讀取', local: '官方資料檢索模式', tryOnline: '再試線上 AI', localButton: '本機資料檢索',
      statusLocal: '正在檢索已收錄資料…', statusOnline: '正在回答；連線不暢時可點選「本機資料檢索」…',
      welcome: '你好，我是 AXAI，阿謝國公共資訊助手。我可以協助查詢憲法、刑法、總統法、國家資料和官方網站入口，也能簡短回答其他問題。阿謝國資料不足時會明確說明。也可以讀取相關官網，或你貼來的 HTTPS 公開網頁。請勿輸入個人敏感資訊。',
      source: '來源：', readAt: '讀取時間：', beijing: '（北京時間）', warning: '未能讀取的網頁：',
      localNotice: '以下是已收錄的官方資料摘錄。', noDate: '資料未標註收錄日期。', date: '資料收錄日期：',
      liveUnavailable: '本機資料檢索無法讀取網頁或確認最新新聞、投票狀態，請直接查看對應官方網站。',
      noResult: '已收錄的官方資料中沒有找到相關資訊，無法確認。請查看官方網站目錄。',
      fallbackNotice: '已切換到本機官方資料檢索，目前無法提供線上 AI 問答或即時網頁讀取。',
      failure: '線上服務和本機資料暫時無法使用，請稍後重試或直接查看官方網站。', directory: '官方網站目錄', site: '阿謝國官方網站',
      quick: [['國家基本資料','国家基本资料'],['查詢法律','查询法律'],['政府機構','政府机构'],['最新新聞','最新新闻'],['查詢投票','查询投票'],['網站導覽','网站导航']],
      readWeb: '讀取網頁', readPrefix: '請讀取並摘要 '
    },
    en: {
      panel: 'AXAI Republic of Axie public information assistant', close: 'Close assistant', input: 'Ask a question', placeholder: 'Ask a question or enter an HTTPS webpage URL…', send: 'Send',
      online: 'AI answers · Web reading', local: 'Official information search', tryOnline: 'Try online AI again', localButton: 'Local information search',
      statusLocal: 'Searching saved official information…', statusOnline: 'Preparing an answer… If the connection fails, choose “Local information search”.',
      welcome: 'Hello, I’m AXAI, the public information assistant for republic of axie. I can help with the Constitution, Criminal Code, Presidential Law, country information, and official websites, as well as brief general questions. I’ll say when the available information is insufficient. I can also read relevant official pages or public HTTPS pages you provide. Please do not enter sensitive personal information.',
      source: 'Source: ', readAt: 'Fetched: ', beijing: ' (Beijing time)', warning: 'Pages that could not be read:',
      localNotice: 'Here are excerpts from the saved official information.', noDate: 'No collection date is recorded.', date: 'Collection date: ',
      liveUnavailable: 'Local search cannot read webpages or confirm current news or voting status. Please check the relevant official website.',
      noResult: 'I could not find this in the saved official information, so I can’t confirm it. Please check the official directory.',
      fallbackNotice: 'Switched to local official information search. Online AI answers and live webpage reading are unavailable right now.',
      failure: 'Online service and local information are temporarily unavailable. Please try again later or visit the official website.', directory: 'Official website directory', site: 'Official website of republic of axie',
      quick: [['Country information','国家基本资料'],['Search laws','查询法律'],['Government bodies','政府机构'],['Latest news','最新新闻'],['Voting','查询投票'],['Website directory','网站导航']],
      readWeb: 'Read a webpage', readPrefix: 'Read and summarize '
    },
    ja: {
      panel: 'AXAI 阿謝国の公共情報アシスタント', close: 'アシスタントを閉じる', input: '質問を入力', placeholder: '質問または HTTPS のウェブページ URL を入力…', send: '送信',
      online: 'AI 回答 · ウェブ閲覧', local: '公式情報の検索モード', tryOnline: 'オンライン AI を再試行', localButton: 'ローカル情報を検索',
      statusLocal: '登録済みの公式情報を検索しています…', statusOnline: '回答を準備しています。接続できない場合は「ローカル情報を検索」を選んでください。',
      welcome: 'こんにちは。阿謝国の公共情報アシスタント AXAI です。憲法、刑法、大統領法、国の情報、公式サイトについて案内し、一般的な質問にも簡潔に回答します。情報が不足している場合はその旨を伝えます。関連する公式サイトや、入力された HTTPS の公開ページも読み取れます。個人情報などの機密情報は入力しないでください。',
      source: '出典：', readAt: '取得時刻：', beijing: '（北京時間）', warning: '読み取れなかったページ：',
      localNotice: '登録済みの公式情報からの抜粋です。', noDate: '収録日は記載されていません。', date: '収録日：',
      liveUnavailable: 'ローカル検索ではウェブページを読んだり、最新ニュースや投票状況を確認したりできません。公式サイトをご確認ください。',
      noResult: '登録済みの公式情報に該当する内容がなく、確認できません。公式サイト一覧をご確認ください。',
      fallbackNotice: 'ローカルの公式情報検索に切り替えました。現在、オンライン AI 回答とリアルタイムのウェブ閲覧は利用できません。',
      failure: 'オンラインサービスとローカル情報を一時的に利用できません。しばらくしてから再試行するか、公式サイトをご確認ください。', directory: '公式サイト一覧', site: '阿謝国公式サイト',
      quick: [['国の基本情報','国家基本资料'],['法律を検索','查询法律'],['政府機関','政府机构'],['最新ニュース','最新新闻'],['投票','查询投票'],['サイト一覧','网站导航']],
      readWeb: 'ウェブを読む', readPrefix: '次のページを読み取り要約してください：'
    }
  };
  function getInterfaceLanguage(){
    const pageLang=(document.documentElement.lang||'').toLowerCase();
    if(pageLang.startsWith('en')) return 'en';
    if(pageLang.startsWith('ja')||pageLang.startsWith('jp')) return 'ja';
    if(pageLang.startsWith('zh')){
      let traditional=/hant|tw|hk|mo/.test(pageLang);
      try{traditional=traditional||localStorage.getItem('roaChineseScript')==='traditional';}catch{}
      return traditional?'zh-Hant':'zh-Hans';
    }
    const browserLang=(navigator.language||'').toLowerCase();
    if(browserLang.startsWith('ja')) return 'ja';
    if(browserLang.startsWith('en')) return 'en';
    return 'zh-Hans';
  }
  let uiLanguage=getInterfaceLanguage();
  const root = document.createElement('div'); document.body.append(root);
  const ui = root.attachShadow({mode:'open'});
  ui.innerHTML = `<style>
  *{box-sizing:border-box}button,input{font:inherit}button{cursor:pointer}button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid #58cafa;outline-offset:2px}
  :host{font:15px/1.6 system-ui,sans-serif;color:#e8f1ff} .launch{position:fixed;right:22px;bottom:22px;z-index:9999;border:1px solid #7dc7ff;border-radius:30px;background:#123d65;color:white;padding:13px 22px;box-shadow:0 8px 25px #0006}
  .panel{position:fixed;right:22px;bottom:86px;z-index:9999;width:min(390px,calc(100vw - 24px));height:min(580px,calc(100dvh - 110px));background:#102a44;border:1px solid #537899;border-radius:18px;box-shadow:0 16px 50px #0008;display:flex;flex-direction:column;overflow:hidden}.panel[hidden]{display:none}
  header{padding:16px;background:#163b5c;display:flex;align-items:center;justify-content:space-between}header small{display:block;color:#a6d9ff} .close{background:none;border:0;color:white;font-size:24px}.messages{flex:1;overflow:auto;padding:15px}.msg{white-space:pre-wrap;background:#1b3d5b;border-radius:12px;padding:12px;margin-bottom:12px;overflow-wrap:anywhere}.user{background:#245a7b;margin-left:32px}a{display:block;color:#9bddff;margin-top:8px}.quick{display:flex;flex-wrap:wrap;gap:6px;padding:0 15px 12px}.quick button{border:1px solid #537899;background:#163b5c;color:white;border-radius:20px;padding:5px 10px;font-size:12px}form{display:flex;gap:8px;padding:12px;border-top:1px solid #537899}input{min-width:0;flex:1;border:1px solid #537899;border-radius:8px;background:#0b1c2d;color:white;padding:9px}form button{background:#82d2ff;color:#102a44;border:0;border-radius:8px;padding:8px 12px}button:disabled{opacity:.5;cursor:wait}
  header,.quick,.status,form{flex-shrink:0}.messages{min-height:0;overscroll-behavior:contain}.close{min-width:44px;min-height:44px;border-radius:10px}.close:hover{background:#ffffff12}input{font-size:16px}form button{min-height:44px}.launch{bottom:max(22px,env(safe-area-inset-bottom))}
  @media(max-width:600px){.launch{right:16px;bottom:max(16px,env(safe-area-inset-bottom));padding:11px 18px}.launch[aria-expanded="true"]{display:none}.panel{right:12px;bottom:max(12px,env(safe-area-inset-bottom));width:calc(100vw - 24px);height:min(640px,calc(100dvh - 24px - env(safe-area-inset-bottom)));border-radius:18px}header{padding:10px 12px}.messages{padding:12px}.quick{flex-wrap:nowrap;overflow-x:auto;gap:8px;padding:4px 12px 10px;overscroll-behavior-x:contain}.quick button{white-space:nowrap;min-height:44px;flex-shrink:0;font-size:13px}.msg{padding:12px;font-size:15px;line-height:1.8}form{padding:10px}.status{max-height:3.5em;overflow:auto}}
  @media(max-height:480px){.panel{bottom:8px;height:calc(100dvh - 16px)}.launch[aria-expanded="true"]{display:none}header small{display:none}}
  </style><button class="launch" aria-expanded="false" aria-controls="axai-panel">🤖 AXAI</button><section id="axai-panel" class="panel" tabindex="-1" hidden><header><div><strong>AXAI</strong><small></small></div><button class="close">×</button></header><div class="messages" role="log" aria-live="polite"></div><div class="quick"></div><div class="status" role="status" aria-live="polite" style="padding:0 15px;color:#a6d9ff;font-size:12px"></div><form><input maxlength="500" required><button type="submit"></button></form></section>`;
  const $ = s => ui.querySelector(s), panel=$('.panel'), launch=$('.launch'), input=$('input'), form=$('form');
  function toggle(open){panel.hidden=!open;launch.setAttribute('aria-expanded',String(open));(open?(window.matchMedia?.('(pointer: coarse)')?.matches?panel:input):launch).focus({preventScroll:true})}
  launch.onclick=()=>toggle(panel.hidden);$('.close').onclick=()=>toggle(false);ui.addEventListener('keydown',e=>{if(e.key==='Escape')toggle(false)});
  function message(text,sources=[],user=false){const c=uiStrings[uiLanguage];const div=document.createElement('div');div.className='msg'+(user?' user':'');div.textContent=text;for(const s of sources){let label;if(!s.url){label=document.createElement('span');label.style.cssText='display:block;color:#9bddff;margin-top:8px';}else{try{const url=new URL(s.url);if(url.protocol!=='https:')continue;label=document.createElement('a');label.href=url.href;label.target='_blank';label.rel='noopener noreferrer';}catch{continue}}label.textContent=c.source+s.title;div.append(label);if(s.fetchedAt){const time=new Date(s.fetchedAt);if(!Number.isNaN(time.valueOf())){const note=document.createElement('small');note.style.cssText='display:block;color:#a6d9ff';const dateLocale={"zh-Hans":"zh-CN","zh-Hant":"zh-TW",en:"en-US",ja:"ja-JP"}[uiLanguage];note.textContent=c.readAt+time.toLocaleString(dateLocale,{timeZone:'Asia/Shanghai',hour12:false})+c.beijing;div.append(note)}}}const messages=$('.messages');messages.append(div);messages.scrollTop=messages.scrollHeight;return div;}
  const welcomeNode=message(uiStrings[uiLanguage].welcome);
  const conversation=[];
  function remember(role,content){conversation.push({role,content:String(content).slice(0,1000)});while(conversation.length>8)conversation.shift();}
  const knowledge=fetch(new URL('axai-knowledge.json',base),{cache:'no-cache',signal:AbortSignal.timeout(10000)}).then(r=>{if(!r.ok)throw Error();return r.json()});knowledge.catch(()=>{});
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

  let busy=false, localMode=!endpoint, activeController=null;
  const modeButton=document.createElement('button');
  modeButton.type='button';
  const readButton=document.createElement('button');
  readButton.type='button';
  function questionLanguage(text,fallback=uiLanguage){
    if(/[\u3040-\u30ff]/.test(text)) return 'ja';
    if(/[\uac00-\ud7af]/.test(text)) return 'ko';
    if(/[\u0400-\u04ff]/.test(text)) return 'ru';
    if(/[\u0600-\u06ff]/.test(text)) return 'ar';
    if(/[\u0900-\u097f]/.test(text)) return 'hi';
    const han=(text.match(/[\u3400-\u9fff]/g)||[]).length;
    const latin=(text.match(/[A-Za-z]/g)||[]).length;
    if(han>0&&han>=latin*0.7){
      const traditional=(text.match(/[體國語問請謝臺灣發現為無與個點網頁讀轉車區漢後經當會應對於總統選舉領導問題簡體繁體號]/g)||[]).length;
      const simplified=(text.match(/[体国语问请谢台湾发现为无与个点网页读转车区汉后经当会应对总统选举领导问题简体繁体号]/g)||[]).length;
      return traditional>simplified?'zh-Hant':(fallback==='zh-Hant'?'zh-Hant':'zh-Hans');
    }
    return latin>0?'en':fallback;
  }
  function updateMode(){
    const c=uiStrings[uiLanguage];
    $('header small').textContent=localMode?c.local:c.online;
    modeButton.textContent=localMode?c.tryOnline:c.localButton;
    modeButton.hidden=!endpoint;
  }
  modeButton.onclick=()=>{
    localMode=!localMode;
    if(localMode)activeController?.abort();
    updateMode();
  };
  function applyInterfaceLanguage(){
    uiLanguage=getInterfaceLanguage();
    const c=uiStrings[uiLanguage];
    panel.setAttribute('aria-label',c.panel);
    launch.setAttribute('aria-label',c.panel);
    $('.close').setAttribute('aria-label',c.close);
    input.setAttribute('aria-label',c.input);
    input.placeholder=c.placeholder;
    form.querySelector('button').textContent=c.send;
    welcomeNode.textContent=c.welcome;
    readButton.textContent=c.readWeb;
    const quick=$('.quick');
    quick.replaceChildren();
    for(const [label,question] of c.quick){
      const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>ask(question,uiLanguage);quick.append(b);
    }
    quick.append(readButton,modeButton);
    updateMode();
  }
  readButton.onclick=()=>{input.value=uiStrings[uiLanguage].readPrefix;input.focus()};
  applyInterfaceLanguage();
  const languageObserver=new MutationObserver(applyInterfaceLanguage);
  languageObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.addEventListener('click',event=>{
    if(event.target instanceof Element&&event.target.closest('.roa-script-toggle')) setTimeout(applyInterfaceLanguage,0);
  },true);
  window.addEventListener('storage',event=>{if(event.key==='roaChineseScript')applyInterfaceLanguage()});
  async function localAnswer(q,notice='',preferredLanguage=null){
    const docs=await knowledge;
    if(!Array.isArray(docs))throw Error('资料格式无效');
    const previousUser=conversation.slice(0,-1).filter(m=>m.role==='user').at(-1)?.content||'';
    const languageSample=/[\p{L}\p{N}]/u.test(q)?q:previousUser||q;
    const answerLocale=preferredLanguage||questionLanguage(languageSample);
    const c=uiStrings[answerLocale]||uiStrings[uiLanguage];
    const retrievalQ=previousUser&&(q.length<36||/(它|这|那|此|刚才|上面|第几|还有呢|然后呢|为什么|怎么做|详细说|继续|呢[？?]?$)/.test(q))?previousUser+'；'+q:q;
    // A local lookup cannot read a supplied webpage or confirm live news/votes.
    const liveRequest=/https?:\/\/|最新|实时|即時|当前|目前|今天|现在|投票结果|\b(latest|current|today|now|live)\b|最新|最新の|現在|今日/.test(q);
    const hits=liveRequest?[]:retrieve(retrievalQ,docs);
    const dates=[...new Set(hits.map(d=>d.verifiedAt).filter(Boolean))].sort();
    const dated=dates.length?c.date+dates.join('、')+'。':c.noDate;
    const answer=liveRequest
      ?c.liveUnavailable
      :hits.length?c.localNotice+dated+'\n\n'+hits.map(d=>d.text).join('\n\n')
      :c.noResult;
    const displayed=(notice?notice+'\n\n':'')+answer;
    message(displayed,hits.length?hits:[{title:c.directory,url:'https://directory.republic-of-axie.org/'}]);
    remember('assistant',displayed);
  }
  async function ask(q,preferredLanguage=null){
    q=q.trim();if(!q||busy)return;
    busy=true;form.querySelector('button').disabled=true;
    const c=uiStrings[uiLanguage];
    $('.status').textContent=localMode?c.statusLocal:c.statusOnline;
    const history=conversation.slice(-8);
    message(q,[],true);remember('user',q);input.value='';
    try{
      if(localMode){await localAnswer(q,'',preferredLanguage);return;}
      const controller=new AbortController();activeController=controller;
      const timer=setTimeout(()=>controller.abort(),60000);
      try{
        const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q,history,uiLanguage,responseLanguage:preferredLanguage}),signal:controller.signal});
        const data=await r.json();
        if(!r.ok)throw Error(data.error||'在线服务暂时不可用');
        if(typeof data.answer!=='string')throw Error('在线服务返回了无效回答');
        const displayed=data.answer+(data.warnings?.length?'\n\n'+c.warning+'\n'+data.warnings.map(w=>w.url+'：'+w.message).join('\n'):'' );
        message(displayed,data.sources||[]);remember('assistant',displayed);
      }finally{clearTimeout(timer);activeController=null;}
    }catch(error){
      localMode=true;updateMode();
      try{
        await localAnswer(q,c.fallbackNotice,preferredLanguage);
      }catch{
        message(c.failure,[{title:c.site,url:'https://republic-of-axie.org/'}]);
      }
    }finally{
      busy=false;$('.status').textContent='';form.querySelector('button').disabled=false;
    }
  }
  form.onsubmit=e=>{e.preventDefault();ask(input.value)};
})();
