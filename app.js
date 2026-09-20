const CONFIG = {
  FREE_MINUTES: 60,
  RATE_PER_HOUR: 20,
  CURRENCY: "฿",
  LOST_FEE: 100
};

let LANG = "th";

const STR = {
  th: {
    home_badge: "จุดรับรถเข้า",
    home_title: "สแกน QR เพื่อรับบิลจอดรถ",
    home_sub: "ใช้กล้องมือถือสแกนโค้ดด้านล่าง ระบบจะออกบิลจอดรถให้ทันทีตามเวลาที่สแกน",
    ticket_badge: "เข้าจอดแล้ว",
    ticket_title: "บัตรจอดรถของคุณ",
    ticket_sub: "เก็บหน้านี้ไว้ หรือบันทึกเป็นรูปภาพ แสดง QR ด้านล่างตอนออกจากลานจอด",
    label_id: "หมายเลขบัตร",
    label_checkin: "เวลาเข้าจอด",
    label_date: "วันที่",
    label_time: "เวลา",
    label_ticketno: "หมายเลขบัตร",
    ticket_qr_note: "แสดง QR นี้ให้เครื่องสแกนตอนออก",
    save_ticket_btn: "บันทึกบัตรลงมือถือ",
    footnote: h => `ชั่วโมงแรกฟรี จากนั้นคิด ${CONFIG.CURRENCY}${h} ต่อชั่วโมง`,
    terms_title: "เงื่อนไข การใช้บริการ",
    terms_disclaimer: "บัตรนี้ไม่ถือเป็นการรับฝากรถ บริษัทฯ ไม่รับผิดชอบในการสูญหาย อุบัติเหตุ หรือความเสียหายใดๆ อันเกิดแก่ทรัพย์สินและยานพาหนะที่จอดภายในอาคาร",
    terms_lostfee: fee => `** กรณีบัตรจอดรถสูญหาย ปรับคิดค่าปรับ ${CONFIG.CURRENCY}${fee} **`,
    not_found_title: "ไม่พบข้อมูลบัตร",
    not_found_sub: "ลิงก์นี้ไม่ถูกต้องหรือหมดอายุ",
    back_home: "กลับหน้าแรก",
    staff_link: "สำหรับเจ้าหน้าที่ (สแกนออก) →"
  },
  en: {
    home_badge: "Entry point",
    home_title: "Scan the QR to get a parking ticket",
    home_sub: "Use your phone camera to scan the code below. A ticket will be issued instantly.",
    ticket_badge: "Checked in",
    ticket_title: "Your parking ticket",
    ticket_sub: "Keep this page, or save it as an image. Show the QR below when you leave.",
    label_id: "Ticket No.",
    label_checkin: "Check-in time",
    label_date: "Date",
    label_time: "Time",
    label_ticketno: "Ticket No.",
    ticket_qr_note: "Show this QR to the scanner when you exit",
    save_ticket_btn: "Save ticket to phone",
    footnote: h => `First hour free, then ${CONFIG.CURRENCY}${h} per hour`,
    terms_title: "Terms of use",
    terms_disclaimer: "This ticket is not a bailment. The company is not liable for any loss, accident, or damage to property or vehicles parked inside the building.",
    terms_lostfee: fee => `** A lost ticket fee of ${CONFIG.CURRENCY}${fee} applies **`,
    not_found_title: "Ticket not found",
    not_found_sub: "This link is invalid or expired.",
    back_home: "Back to home",
    staff_link: "Staff exit scanner →"
  }
};

function tr(k, ...args){
  const v = STR[LANG][k];
  return typeof v === "function" ? v(...args) : v;
}

function dtLocale(){ return LANG === "th" ? "th-TH" : "en-GB"; }

function fmtDate(ms){
  return new Date(ms).toLocaleDateString(dtLocale(), {
    day:'2-digit', month:'2-digit', year:'2-digit'
  });
}

function fmtTime(ms){
  return new Date(ms).toLocaleTimeString(dtLocale(), {
    hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false
  });
}

function playDing(){
  try{
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(1318.51, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.09);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.55);
  }catch(e){}
}

function vibrate(p){ try{ if(navigator.vibrate) navigator.vibrate(p); }catch(e){} }

function parseHash(){
  const hash = location.hash.replace(/^#/, "") || "/";
  const [path, qs] = hash.split("?");
  const params = new URLSearchParams(qs || "");
  return { path: path || "/", params };
}

function buildUrl(path, params){
  const qs = new URLSearchParams(params).toString();
  return location.origin + location.pathname + "#" + path + (qs ? "?" + qs : "");
}

function render(){
  const { path, params } = parseHash();
  const view = document.getElementById("view");
  if(!view) return;
  view.innerHTML = "";

  if(path === "/") renderHome(view);
  else if(path === "/checkin") handleCheckin();
  else if(path === "/ticket") renderTicket(view, params);
  else renderNotFound(view);
}

function renderHome(view){
  view.innerHTML = `
    <div class="card">
      <span class="badge">${tr('home_badge')}</span>
      <h1>${tr('home_title')}</h1>
      <p class="sub">${tr('home_sub')}</p>
      <div class="qr-wrap qr-pop" id="qrcode"></div>
      <a class="staff-link" href="exit-scan.html">${tr('staff_link')}</a>
    </div>
  `;
  const url = buildUrl("/checkin", {});
  if(typeof QRCode !== "undefined"){
    new QRCode(document.getElementById("qrcode"), { text: url, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
  }
}

function handleCheckin(){
  let ticketId = "";
  try {
    if(window.pyscript && pyscript.interpreter && pyscript.interpreter.globals){
      const pyGen = pyscript.interpreter.globals.get('gen_ticket_id_py');
      if(typeof pyGen === 'function') ticketId = pyGen();
    }
  } catch(e) {}
  
  if(!ticketId){
    const randSuffix = Math.random().toString(36).slice(2, 4).toUpperCase();
    ticketId = "P-" + Date.now().toString(36).toUpperCase().slice(-6) + randSuffix;
  }

  const t = Date.now();
  location.replace(buildUrl("/ticket", { id: ticketId, t }));
}

function renderTicket(view, params){
  const id = params.get("id");
  const t = Number(params.get("t"));
  if(!id || !t || isNaN(t)) return renderNotFound(view);

  view.innerHTML = `
    <div class="card" id="ticketCard">
      <span class="badge ok">${tr('ticket_badge')}</span>
      <h1>${tr('ticket_title')}</h1>
      <p class="sub">${tr('ticket_sub')}</p>
      <div class="row"><span class="label">${tr('label_date')}</span><span class="value">${fmtDate(t)}</span></div>
      <div class="row"><span class="label">${tr('label_time')}</span><span class="value">${fmtTime(t)}</span></div>
      <div class="row"><span class="label">${tr('label_ticketno')}</span><span class="value">${id}</span></div>
      <div class="qr-wrap qr-pop" id="qrcode" style="margin-top:20px;"></div>
      <p class="sub" style="margin:14px 0 0 0; text-align:center;">${tr('ticket_qr_note')}</p>
      <div class="terms">
        <p class="terms-title">${tr('terms_title')}</p>
        <p class="terms-price">${tr('footnote', CONFIG.RATE_PER_HOUR)}</p>
        <p class="terms-text">${tr('terms_disclaimer')}</p>
        <p class="terms-lostfee">${tr('terms_lostfee', CONFIG.LOST_FEE)}</p>
      </div>
    </div>
    <button class="btn btn-primary no-print" id="saveBtn">${tr('save_ticket_btn')}</button>
  `;

  const checkoutUrl = buildUrl("/checkout", { id, t });
  if(typeof QRCode !== "undefined"){
    new QRCode(document.getElementById("qrcode"), { text: checkoutUrl, width: 180, height: 180, correctLevel: QRCode.CorrectLevel.M });
  }

  playDing();
  vibrate(60);

  const saveBtn = document.getElementById("saveBtn");
  if(saveBtn){
    saveBtn.onclick = () => {
      if(typeof html2canvas === "undefined"){
        alert("html2canvas library is missing!");
        return;
      }
      const card = document.getElementById("ticketCard");
      card.querySelectorAll(".qr-pop").forEach(el => el.style.animation = "none");
      html2canvas(card, { backgroundColor: "#ffffff", scale: 2 }).then(canvas => {
        const link = document.createElement("a");
        link.download = "parking-ticket-" + id + ".png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    };
  }
}

function renderNotFound(view){
  view.innerHTML = `
    <div class="card error">
      <h1>${tr('not_found_title')}</h1>
      <p class="sub">${tr('not_found_sub')}</p>
      <a class="btn btn-primary" href="#/">${tr('back_home')}</a>
    </div>
  `;
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => {
  const langLabel = document.getElementById("langLabel");
  const langToggle = document.getElementById("langToggle");
  if(langToggle){
    langToggle.onclick = () => {
      LANG = LANG === "th" ? "en" : "th";
      if(langLabel) langLabel.textContent = LANG === "th" ? "EN" : "TH";
      render();
    };
  }
  if(!location.hash) location.hash = "/";
  render();
});
