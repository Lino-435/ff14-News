"use client";
import { useState } from "react";

const CATEGORIES = [
  { id: "all", label: "すべて", icon: "⚔️" },
  { id: "content", label: "コンテンツ", icon: "🏰" },
  { id: "reward", label: "報酬・装備", icon: "✨" },
  { id: "buzz", label: "話題", icon: "🔥" },
  { id: "limited", label: "期間限定", icon: "⏰" },
];

const urgencyConfig = {
  high:   { dot: "#ff4d4d", label: "要チェック" },
  medium: { dot: "#ffb347", label: "注目" },
  low:    { dot: "#4dd2ff", label: "情報" },
};

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function isSameDay(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function Calendar({ selectedDate, onSelect, calendarOpen, onToggle, dataDates }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const WEEKDAYS = ["日","月","火","水","木","金","土"];
  const monthNames = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
  const prevMonth = () => { if(viewMonth===0){setViewYear(y=>y-1);setViewMonth(11);}else setViewMonth(m=>m-1); };
  const nextMonth = () => { if(viewMonth===11){setViewYear(y=>y+1);setViewMonth(0);}else setViewMonth(m=>m+1); };

  return (
    <div style={{ margin: "0 16px" }}>
      <button onClick={onToggle} style={{ width:"100%", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(180,140,80,0.2)", borderRadius: calendarOpen?"14px 14px 0 0":14, padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
        <span style={{ fontSize:12, color:"rgba(180,140,80,0.8)", fontFamily:"'Cinzel', serif", letterSpacing:"0.06em" }}>📅 {viewYear}年 {monthNames[viewMonth]}</span>
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", transform: calendarOpen?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.25s", display:"inline-block" }}>▼</span>
      </button>
      {calendarOpen && (
        <div style={{ background:"rgba(10,8,6,0.95)", border:"1px solid rgba(180,140,80,0.2)", borderTop:"none", borderRadius:"0 0 14px 14px", padding:"12px 14px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <button onClick={prevMonth} style={navBtnStyle}>‹</button>
            <span style={{ fontSize:13, color:"rgba(255,255,255,0.6)", fontFamily:"sans-serif" }}>{viewYear}年 {monthNames[viewMonth]}</span>
            <button onClick={nextMonth} style={navBtnStyle}>›</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
            {WEEKDAYS.map((d,i) => <div key={d} style={{ textAlign:"center", fontSize:10, color: i===0?"rgba(255,100,100,0.6)":i===6?"rgba(100,160,255,0.6)":"rgba(255,255,255,0.25)", fontFamily:"sans-serif", padding:"2px 0" }}>{d}</div>)}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"3px 0" }}>
            {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
            {Array.from({length:daysInMonth}).map((_,i)=>{
              const day=i+1, date=new Date(viewYear,viewMonth,day), key=toDateKey(date);
              const hasData=dataDates.includes(key);
              const isSelected=isSameDay(date,selectedDate), isToday=isSameDay(date,today), isFuture=date>today;
              return (
                <div key={day} onClick={()=>!isFuture&&hasData&&onSelect(date)} style={{ textAlign:"center", padding:"5px 2px", borderRadius:8, cursor:hasData&&!isFuture?"pointer":"default", background:isSelected?"rgba(180,140,80,0.2)":"transparent", border:isSelected?"1px solid rgba(180,140,80,0.5)":isToday?"1px solid rgba(180,140,80,0.25)":"1px solid transparent", transition:"all 0.15s" }}>
                  <span style={{ fontSize:12, fontFamily:"sans-serif", color:isFuture?"rgba(255,255,255,0.1)":isSelected?"rgba(224,192,120,1)":isToday?"rgba(180,140,80,0.9)":hasData?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.25)" }}>{day}</span>
                  {hasData&&!isFuture&&<div style={{ width:4, height:4, borderRadius:"50%", background:"rgba(180,140,80,0.8)", margin:"2px auto 0" }}/>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const navBtnStyle = { background:"transparent", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"rgba(255,255,255,0.5)", fontSize:16, width:32, height:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 };

function NewsCard({ item, onClick }) {
  const urg = urgencyConfig[item.urgency] || urgencyConfig.low;
  return (
    <div onClick={()=>onClick(item)} style={{ background:"linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"18px 20px", cursor:"pointer", transition:"all 0.2s ease", position:"relative", overflow:"hidden" }}
      onMouseEnter={e=>{e.currentTarget.style.background="linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)";e.currentTarget.style.borderColor="rgba(180,140,80,0.4)";e.currentTarget.style.transform="translateY(-2px)";}}
      onMouseLeave={e=>{e.currentTarget.style.background="linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)";e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.transform="translateY(0)";}}>
      <div style={{ position:"absolute", top:0, left:0, width:3, height:"100%", background:urg.dot, borderRadius:"16px 0 0 16px" }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:urg.dot, flexShrink:0 }}/>
          <span style={{ fontSize:10, color:urg.dot, fontFamily:"'Cinzel', serif", letterSpacing:"0.08em" }}>{urg.label}</span>
        </div>
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"sans-serif" }}>{item.source}</span>
      </div>
      <h3 style={{ margin:"0 0 8px 0", fontSize:15, fontFamily:"'Noto Serif JP', serif", color:"rgba(255,255,255,0.92)", lineHeight:1.4, fontWeight:600 }}>{item.title}</h3>
      <p style={{ margin:"0 0 12px 0", fontSize:12, color:"rgba(255,255,255,0.5)", lineHeight:1.7, fontFamily:"sans-serif", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{item.summary}</p>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {(item.tags||[]).map(t=><span key={t} style={{ fontSize:10, color:"rgba(180,140,80,0.8)", background:"rgba(180,140,80,0.08)", border:"1px solid rgba(180,140,80,0.2)", padding:"2px 8px", borderRadius:20, fontFamily:"sans-serif" }}>#{t}</span>)}
      </div>
    </div>
  );
}

function DetailModal({ item, onClose }) {
  if(!item) return null;
  const urg = urgencyConfig[item.urgency] || urgencyConfig.low;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(8px)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:480, background:"linear-gradient(180deg, #1a1610 0%, #0e0c09 100%)", border:"1px solid rgba(180,140,80,0.2)", borderRadius:"24px 24px 0 0", padding:"28px 24px 40px", maxHeight:"80vh", overflowY:"auto" }}>
        <div style={{ width:40, height:4, background:"rgba(255,255,255,0.15)", borderRadius:2, margin:"0 auto 24px" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:urg.dot }}/>
          <span style={{ fontSize:11, color:urg.dot, fontFamily:"'Cinzel', serif" }}>{urg.label}</span>
        </div>
        <h2 style={{ margin:"0 0 16px 0", fontSize:20, fontFamily:"'Noto Serif JP', serif", color:"rgba(255,255,255,0.95)", lineHeight:1.4, fontWeight:700 }}>{item.title}</h2>
        <p style={{ fontSize:14, color:"rgba(255,255,255,0.65)", lineHeight:1.8, fontFamily:"sans-serif", marginBottom:20 }}>{item.summary}</p>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }}>
          {(item.tags||[]).map(t=><span key={t} style={{ fontSize:11, color:"rgba(180,140,80,0.9)", background:"rgba(180,140,80,0.1)", border:"1px solid rgba(180,140,80,0.25)", padding:"3px 10px", borderRadius:20, fontFamily:"sans-serif" }}>#{t}</span>)}
        </div>
        <div style={{ padding:"12px 16px", background:"rgba(255,255,255,0.03)", borderRadius:12, border:"1px solid rgba(255,255,255,0.06)", fontSize:12, color:"rgba(255,255,255,0.35)", fontFamily:"sans-serif" }}>📡 情報ソース: {item.source}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status, label }) {
  const cfg = {
    idle:     { color:"rgba(255,255,255,0.2)", text:"待機中" },
    fetching: { color:"#ffb347", text:"取得中..." },
    summarizing: { color:"#c084fc", text:"AI要約中..." },
    done:     { color:"#4dd2ff", text:"完了" },
    error:    { color:"#ff6b6b", text:"エラー" },
  }[status] || { color:"rgba(255,255,255,0.2)", text:status };
  return <span style={{ fontSize:10, color:cfg.color, fontFamily:"sans-serif" }}>{label}: {cfg.text}</span>;
}

export default function Home() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [items, setItems] = useState([]);
  const [fetchStatus, setFetchStatus] = useState({ lodestone:"idle", yahoo:"idle", ai:"idle" });
  const [lastUpdate, setLastUpdate] = useState(null);
  const [errorDetail, setErrorDetail] = useState("");

  const isToday = isSameDay(selectedDate, today);
  const filtered = activeCategory==="all" ? items : items.filter(i=>i.category===activeCategory);
  const dateLabel = isToday ? "今日" : `${selectedDate.getMonth()+1}月${selectedDate.getDate()}日`;
  const dataDates = items.length > 0 ? [toDateKey(today)] : [];
  const isFetching = Object.values(fetchStatus).some(s => s === "fetching" || s === "summarizing");

  const handleFetch = async () => {
    setItems([]);
    setErrorDetail("");
    let lodestoneItems = [];
    let tweets = [];

    // 1. Lodestone取得
    setFetchStatus({ lodestone:"fetching", yahoo:"idle", ai:"idle" });
    try {
      const res = await fetch("/api/lodestone");
      const data = await res.json();
      if (data.items) lodestoneItems = data.items;
      setFetchStatus(s => ({ ...s, lodestone: lodestoneItems.length > 0 ? "done" : "error" }));
    } catch (e) {
      setFetchStatus(s => ({ ...s, lodestone: "error" }));
    }

    // 2. Yahoo RT取得
    setFetchStatus(s => ({ ...s, yahoo: "fetching" }));
    try {
      const res = await fetch("/api/yahoo-rt?q=FF14+FFXIV");
      const data = await res.json();
      if (data.tweets) tweets = data.tweets;
      setFetchStatus(s => ({ ...s, yahoo: tweets.length > 0 ? "done" : "error" }));
    } catch (e) {
      setFetchStatus(s => ({ ...s, yahoo: "error" }));
    }

    // 3. AI要約
    if (lodestoneItems.length > 0 || tweets.length > 0) {
      setFetchStatus(s => ({ ...s, ai: "summarizing" }));
      try {
        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lodestone_items: lodestoneItems, tweets }),
        });
        const data = await res.json();
        if (data.error) {
          setErrorDetail(data.error);
          setFetchStatus(s => ({ ...s, ai: "error" }));
        } else if (data.summaries && data.summaries.length > 0) {
          const newItems = data.summaries.map((s, i) => ({
            id: `live_${Date.now()}_${i}`,
            title: s.title,
            summary: s.summary,
            category: s.category || "buzz",
            urgency: s.urgency || "medium",
            tags: s.tags || [],
            source: s.source || "AI要約",
          }));
          setItems(newItems);
          setFetchStatus(s => ({ ...s, ai: "done" }));
        } else {
          setFetchStatus(s => ({ ...s, ai: "error" }));
        }
      } catch (e) {
        setErrorDetail(e.message);
        setFetchStatus(s => ({ ...s, ai: "error" }));
      }
    }

    setLastUpdate(new Date());
  };

  const updateStr = lastUpdate
    ? `${lastUpdate.getMonth()+1}月${lastUpdate.getDate()}日 ${lastUpdate.getHours()}:${String(lastUpdate.getMinutes()).padStart(2,"0")}`
    : "未取得";

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(180deg, #0a0806 0%, #0e0c09 40%, #0a0806 100%)", color:"#fff", fontFamily:"sans-serif", maxWidth:480, margin:"0 auto", position:"relative" }}>
      <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:480, height:300, background:"radial-gradient(ellipse at 50% 0%, rgba(180,140,80,0.08) 0%, transparent 70%)", pointerEvents:"none", zIndex:0 }}/>

      <div style={{ position:"relative", zIndex:1 }}>
        {/* ヘッダー */}
        <div style={{ padding:"20px 20px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:10, letterSpacing:"0.25em", color:"rgba(180,140,80,0.7)", fontFamily:"'Cinzel', serif", marginBottom:4 }}>EORZEA INTELLIGENCE</div>
              <h1 style={{ margin:0, fontSize:26, fontFamily:"'Noto Serif JP', serif", fontWeight:700, background:"linear-gradient(135deg, #e8d5a3 0%, #b48c50 60%, #8a6830 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1.2 }}>光の戦士<br/>情報局</h1>
            </div>
            <button
              onClick={handleFetch}
              disabled={isFetching}
              style={{
                background: isFetching ? "rgba(180,140,80,0.05)" : "rgba(180,140,80,0.1)",
                border: "1px solid rgba(180,140,80,0.3)", borderRadius:12, padding:"10px 14px",
                color: isFetching ? "rgba(180,140,80,0.4)" : "rgba(180,140,80,0.9)",
                cursor: isFetching ? "not-allowed" : "pointer",
                fontSize:12, fontFamily:"'Cinzel', serif", letterSpacing:"0.05em",
                display:"flex", alignItems:"center", gap:6
              }}
            >
              {isFetching ? "取得中..." : "⟳ 最新取得"}
            </button>
          </div>

          <div style={{ marginTop:8, fontSize:11, color:"rgba(255,255,255,0.25)", fontFamily:"sans-serif" }}>
            最終更新: {updateStr}
          </div>

          {/* 取得ステータス */}
          {fetchStatus.lodestone !== "idle" && (
            <div style={{ marginTop:10, padding:"10px 14px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, display:"flex", flexDirection:"column", gap:4 }}>
              <StatusBadge status={fetchStatus.lodestone} label="📡 Lodestone" />
              <StatusBadge status={fetchStatus.yahoo} label="🐦 X話題" />
              <StatusBadge status={fetchStatus.ai} label="🤖 AI要約" />
            </div>
          )}

          {errorDetail && (
            <div style={{ marginTop:8, padding:"8px 12px", background:"rgba(255,77,77,0.08)", border:"1px solid rgba(255,77,77,0.2)", borderRadius:10, fontSize:11, color:"rgba(255,150,150,0.7)", fontFamily:"sans-serif" }}>
              {errorDetail}
            </div>
          )}

          {items.filter(i=>i.urgency==="high").length > 0 && (
            <div style={{ marginTop:12, padding:"10px 14px", background:"linear-gradient(135deg, rgba(255,77,77,0.08), rgba(255,77,77,0.03))", border:"1px solid rgba(255,77,77,0.2)", borderRadius:12, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:14 }}>🔴</span>
              <span style={{ fontSize:12, color:"rgba(255,150,150,0.9)", fontFamily:"sans-serif" }}>要チェックの情報が{items.filter(i=>i.urgency==="high").length}件あります</span>
            </div>
          )}
        </div>

        {/* カレンダー */}
        <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} calendarOpen={calendarOpen} onToggle={()=>setCalendarOpen(o=>!o)} dataDates={dataDates} />

        {/* 日付ラベル＋カテゴリ */}
        <div style={{ padding:"14px 20px 0" }}>
          <div style={{ fontSize:13, color:"rgba(180,140,80,0.7)", fontFamily:"'Noto Serif JP', serif", marginBottom:10 }}>
            {dateLabel}のニュース
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.2)", marginLeft:8, fontFamily:"sans-serif" }}>{filtered.length}件</span>
          </div>
          <div style={{ display:"flex", gap:8, overflowX:"auto", scrollbarWidth:"none", WebkitOverflowScrolling:"touch" }}>
            {CATEGORIES.map(cat=>(
              <button key={cat.id} onClick={()=>setActiveCategory(cat.id)} style={{ flexShrink:0, padding:"7px 14px", borderRadius:20, border:activeCategory===cat.id?"1px solid rgba(180,140,80,0.5)":"1px solid rgba(255,255,255,0.08)", background:activeCategory===cat.id?"rgba(180,140,80,0.12)":"transparent", color:activeCategory===cat.id?"rgba(180,140,80,0.95)":"rgba(255,255,255,0.4)", fontSize:12, cursor:"pointer", fontFamily:"sans-serif", transition:"all 0.2s", whiteSpace:"nowrap" }}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* カードリスト */}
        <div style={{ padding:"14px 16px 40px", display:"flex", flexDirection:"column", gap:12 }}>
          {isFetching ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(180,140,80,0.5)" }}>
              <div style={{ fontSize:28, marginBottom:12, animation:"pulse 1.5s ease infinite" }}>⚔️</div>
              <div style={{ fontSize:13, fontFamily:"'Cinzel', serif", letterSpacing:"0.1em" }}>エオルゼアの情報を収集中...</div>
            </div>
          ) : filtered.length===0 ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize:24, marginBottom:8 }}>📭</div>
              <div style={{ fontSize:13 }}>「最新取得」ボタンで情報を取得できます</div>
            </div>
          ) : filtered.map(item=><NewsCard key={item.id} item={item} onClick={setSelectedItem}/>)}
        </div>
      </div>

      <DetailModal item={selectedItem} onClose={()=>setSelectedItem(null)} />

      <style>{`
        @keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{display:none}
      `}</style>
    </div>
  );
}
