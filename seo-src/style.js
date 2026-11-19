// One shared inline stylesheet for all SEO pages (mobile-first, dark/light via prefers-color-scheme).
export const CSS = `@font-face{font-family:Uthmani;src:url(/Uthmani.woff2) format("woff2");font-display:swap}
:root{--bg:#0C1626;--card:#222C3E;--line:#454D5D;--chip:#323744;--tx:rgba(255,255,255,.9);--mu:rgba(255,255,255,.6);--ac:rgb(90,167,255);--ar:#f2e7c9}
@media (prefers-color-scheme:light){:root{--bg:#F6F8FC;--card:#fff;--line:#d9dee8;--chip:#eef2f8;--tx:#1b2433;--mu:#5b6578;--ac:#1f6fd1;--ar:#1b2433}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans",sans-serif;padding:0 14px 40px;max-width:820px;margin-inline:auto;overflow-wrap:anywhere}
a{color:var(--ac);text-decoration:none}a:hover{text-decoration:underline}
.top{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--line)}
.brand{font-weight:700;font-size:20px;color:var(--tx);letter-spacing:.3px}
.reader{font-size:14px;border:1px solid var(--line);border-radius:999px;padding:5px 12px;white-space:nowrap}
.crumbs{font-size:13px;color:var(--mu);padding:10px 0;display:flex;flex-wrap:wrap;gap:4px}
.crumbs .sep{opacity:.6;padding:0 2px}
h1{font-size:clamp(22px,6vw,30px);line-height:1.3;margin:8px 0 12px}
h1 small{font-size:.6em;color:var(--mu)}
h2{font-size:19px;margin:28px 0 10px}
.h1ar{font-family:Uthmani,"Noto Naskh Arabic",serif;font-weight:400;color:var(--ar);white-space:nowrap}
.lead,.note{color:var(--mu)}.note{font-size:13px;margin:6px 0}
.ar{font-family:Uthmani,"Amiri","Noto Naskh Arabic","Scheherazade New",serif;font-size:clamp(24px,7vw,32px);line-height:2.1;color:var(--ar);text-align:right;margin:4px 0}
.ar.big{font-size:clamp(28px,8.5vw,40px);line-height:2.2}
.end{white-space:nowrap}
.basmala{font-family:Uthmani,serif;font-size:clamp(24px,7vw,32px);text-align:center;color:var(--ar);margin:18px 0}
.ayahbox{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px}
audio{width:100%;margin-top:8px;height:40px}
.trn{margin:0 0 12px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.trn blockquote{margin:0;font-size:17px}
.trn blockquote[dir=rtl]{font-size:20px;line-height:1.9;font-family:"Noto Nastaliq Urdu","Noto Naskh Arabic",system-ui,serif}
.trn figcaption{color:var(--mu);font-size:13px;margin-top:6px}
.ayahs{display:flex;flex-direction:column;gap:10px}
.ay{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 14px}
.ay .ref{font-size:13px;font-weight:600}
.ay .tr{margin:2px 0 4px}
.tr[dir=rtl]{font-size:19px;line-height:1.9}
.info{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:0 0 14px}
.info div{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:8px 12px}
.info dt{font-size:12px;color:var(--mu)}.info dd{margin:0;font-weight:600}
.surahs{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px}
.surahs a{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 12px;color:var(--tx);height:100%}
.surahs a:hover{border-color:var(--ac);text-decoration:none}
.surahs .no{min-width:34px;height:34px;border-radius:50%;background:var(--chip);display:grid;place-items:center;font-size:13px;font-weight:700}
.surahs .nm{flex:1;display:flex;flex-direction:column;line-height:1.3}
.surahs small{color:var(--mu);font-size:12px}
.surahs .arn{font-family:Uthmani,serif;font-size:22px;color:var(--ar)}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{background:var(--chip);border:1px solid var(--line);border-radius:999px;padding:5px 12px;font-size:14px;color:var(--tx)}
.wbw{width:100%;border-collapse:collapse;background:var(--card);border-radius:12px;overflow:hidden}
.wbw th,.wbw td{border-bottom:1px solid var(--line);padding:6px 10px;text-align:start;vertical-align:middle}
.wbw th{font-size:13px;color:var(--mu);font-weight:600}
.wbw td.ar{font-size:26px;line-height:1.8;text-align:right}
.wbw td:first-child{color:var(--mu);font-size:13px;width:2.5em;white-space:nowrap;overflow-wrap:normal}
.actions{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}
.btn{display:inline-block;border:1px solid var(--line);border-radius:10px;padding:10px 16px;font-weight:600;background:var(--card)}
.btn.primary{background:var(--ac);border-color:var(--ac);color:#fff}
.btn:hover{text-decoration:none;filter:brightness(1.08)}
.pn{display:flex;justify-content:space-between;gap:10px;margin:24px 0;flex-wrap:wrap}
.pn a{border:1px solid var(--line);border-radius:10px;padding:10px 14px;background:var(--card);flex:1 1 200px}
.pn a[rel=next]{text-align:end}
.pager{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}
.pager a,.pager span{min-width:36px;text-align:center;border:1px solid var(--line);border-radius:8px;padding:4px 8px}
.pager span{background:var(--ac);color:#fff;border-color:var(--ac)}
footer{margin-top:36px;border-top:1px solid var(--line);padding-top:14px;font-size:14px;color:var(--mu)}
.langs summary{cursor:pointer;color:var(--ac)}
.langlist{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:10px}
.langlist a[aria-current]{font-weight:700;color:var(--tx)}
`;
