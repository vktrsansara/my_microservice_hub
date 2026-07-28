'use strict';
// ═══════════════════ TOKENS ═══════════════════
const T={
  EOF:0,EOL:1,COMMA:2,LPAREN:0x03,RPAREN:0x04,
  FOR:0x10,TO:0x11,STEP:0x12,NEXT:0x13,
  IF:0x14,THEN:0x15,GOTO:0x16,GOSUB:0x17,RETURN:0x18,
  CLEAR:0x20,FILL:0x21,SET:0x22,SETHSV:0x23,
  WAIT:0x24,DELAY:0x25,SHOW:0x26,BRIGHT:0x27,FADE:0x28,MIRROR:0x29,
  VAR:0x30,NUM:0x31,
  ASSIGN:0x40,EQ:0x41,NEQ:0x42,GT:0x43,LT:0x44,GE:0x45,LE:0x46,
  PLUS:0x50,MINUS:0x51,MUL:0x52,DIV:0x53,MOD:0x54,AND:0x55,OR:0x56,
  RND:0x60,ABS:0x61,MIN:0x62,MAX:0x63,SIN8:0x64,COS8:0x65,PIXEL:0x66,NOISE:0x67,
  MAP:0x68,CONSTRAIN:0x69,EXP8:0x6A
};

// sorted longest-first
const KW=[
  ['SET_HSV',T.SETHSV],['RETURN',T.RETURN],['GOSUB',T.GOSUB],
  ['CONSTRAIN',T.CONSTRAIN],['MIRROR',T.MIRROR],
  ['DELAY',T.DELAY],['CLEAR',T.CLEAR],['BRIGHT',T.BRIGHT],['FADE',T.FADE],
  ['FILL',T.FILL],['SHOW',T.SHOW],['WAIT',T.WAIT],
  ['GOTO',T.GOTO],['NEXT',T.NEXT],['STEP',T.STEP],
  ['THEN',T.THEN],['SET',T.SET],['FOR',T.FOR],
  ['TO',T.TO],['IF',T.IF],
  ['SIN8',T.SIN8],['COS8',T.COS8],['NOISE',T.NOISE],['PIXEL',T.PIXEL],
  ['EXP8',T.EXP8],['MAP',T.MAP],
  ['RND',T.RND],['ABS',T.ABS],['MIN',T.MIN],['MAX',T.MAX],
  ['AND',T.AND],['OR',T.OR],
  ['==',T.EQ],['!=',T.NEQ],['>=',T.GE],['<=',T.LE],
  ['>',T.GT],['<',T.LT],['=',T.ASSIGN],
  ['+',T.PLUS],['-',T.MINUS],['*',T.MUL],['/',T.DIV],['%',T.MOD],[',',T.COMMA]
];

// SIN8/COS8 LUT
const SIN8=new Uint8Array(256);
for(let i=0;i<256;i++) SIN8[i]=Math.round(128+127*Math.sin(i*2*Math.PI/256));
const sin8=x=>SIN8[x&255];
const cos8=x=>SIN8[(x+64)&255];

// 2D Value Noise — точное соответствие LedBasic.cpp inoise8()
// x, y — uint16 (0..65535), возвращает 0..255
function inoise8(x, y){
  const xi=(x>>8)&255, yi=(y>>8)&255;
  const xf=x&255,      yf=y&255;
  // ease curve (smoothstep): u = xf² × (765 - 2×xf) >> 16
  const ease=u=>{ const uu=u&255; return ((uu*uu*(765-2*uu))>>16)&255; };
  const u=ease(xf), v=ease(yf);
  // hash — тот же алгоритм что в C++ (усечение до uint8)
  const hash=(i,j)=>{
    let s=(((i*0x9E3779B9)>>>0)+((j*0x85EBCA6B)>>>0))>>>0;
    s=(s^(s>>>13))>>>0;
    s=Math.imul(s,0xC2B2AE35)>>>0;
    s=(s^(s>>>16))>>>0;
    return s&255;
  };
  const h00=hash(xi,   yi);
  const h10=hash((xi+1)&255, yi);
  const h01=hash(xi,   (yi+1)&255);
  const h11=hash((xi+1)&255, (yi+1)&255);
  const nx0=(h00+((((h10-h00)*u)>>8)))&255;
  const nx1=(h01+((((h11-h01)*u)>>8)))&255;
  return (nx0+((((nx1-nx0)*v)>>8)))&255;
}

// EXP8 — гамма-таблица: round(255 * (x/255)^2.2)
const _exp8=new Uint8Array([
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,
    1,  1,  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  2,  2,  2,  2,
    3,  3,  3,  3,  3,  4,  4,  4,  4,  5,  5,  5,  5,  6,  6,  6,
    6,  7,  7,  7,  8,  8,  8,  9,  9,  9, 10, 10, 11, 11, 11, 12,
   12, 13, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18, 18, 19, 19,
   20, 20, 21, 22, 22, 23, 23, 24, 25, 25, 26, 26, 27, 28, 28, 29,
   30, 30, 31, 32, 33, 33, 34, 35, 35, 36, 37, 38, 39, 39, 40, 41,
   42, 43, 43, 44, 45, 46, 47, 48, 49, 49, 50, 51, 52, 53, 54, 55,
   56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71,
   73, 74, 75, 76, 77, 78, 79, 81, 82, 83, 84, 85, 87, 88, 89, 90,
   91, 93, 94, 95, 97, 98, 99,100,102,103,105,106,107,109,110,111,
  113,114,116,117,119,120,121,123,124,126,127,129,130,132,133,135,
  137,138,140,141,143,145,146,148,149,151,153,154,156,158,159,161,
  163,165,166,168,170,172,173,175,177,179,181,182,184,186,188,190,
  192,194,196,197,199,201,203,205,207,209,211,213,215,217,219,221,
  223,225,227,229,231,234,236,238,240,242,244,246,248,251,253,255
]);
const exp8=x=>_exp8[x<0?0:x>255?255:x];

const clamp=v=>Math.max(0,Math.min(255,v+.5|0));
const s16=v=>{v=v&0xFFFF;return v>=32768?v-65536:v};

// ═══════════════════ COMPILER ═══════════════════
function compileLine(raw){
  let s=raw.trim();
  // strip comment
  const ci=s.indexOf("'"); if(ci>=0) s=s.slice(0,ci).trimEnd();
  if(!s) return null;
  let p=0;
  function ws(){ while(p<s.length&&s[p]===' ')p++; }
  ws();
  // line number
  const ns=p;
  while(p<s.length&&s[p]>='0'&&s[p]<='9') p++;
  if(p===ns) return{err:'Нет номера строки'};
  const ln=parseInt(s.slice(ns,p),10);
  if(ln<1||ln>65534) return{err:'Номер строки '+ln+' вне диапазона'};
  ws();
  const body=[];
  while(p<s.length){
    ws(); if(p>=s.length) break;
    let hit=false;
    for(const[w,tok] of KW){
      if(s.substr(p,w.length)===w){
        // word boundary check for alpha keywords
        if(/[A-Z_]/.test(w[w.length-1])){
          const nx=s[p+w.length];
          if(nx&&/[A-Z0-9_]/.test(nx)) continue;
        }
        body.push(tok); p+=w.length; hit=true; break;
      }
    }
    if(hit) continue;
    // negative literal
    if(s[p]==='-'&&p+1<s.length&&s[p+1]>='0'&&s[p+1]<='9'){
      p++;
      const q=p; while(p<s.length&&s[p]>='0'&&s[p]<='9') p++;
      const n=s16(-parseInt(s.slice(q,p),10));
      body.push(T.NUM,(n>>8)&255,n&255); continue;
    }
    // positive literal
    if(s[p]>='0'&&s[p]<='9'){
      const q=p; while(p<s.length&&s[p]>='0'&&s[p]<='9') p++;
      const n=s16(parseInt(s.slice(q,p),10));
      body.push(T.NUM,(n>>8)&255,n&255); continue;
    }
    // variable A-Z (single letter only)
    if(s[p]>='A'&&s[p]<='Z'){
      const nx=s[p+1];
      if(!nx||!/[A-Z0-9_]/.test(nx)){
        body.push(T.VAR, s.charCodeAt(p)-65); p++; continue;
      }
    }
    // parentheses
    if(s[p]==='('){ body.push(T.LPAREN); p++; continue; }
    if(s[p]===')'){ body.push(T.RPAREN); p++; continue; }
    return{err:'Неизвестный токен: "'+s.slice(p,p+8)+'"'};
  }
  body.push(T.EOL);
  return{ln, bytes:[(ln>>8)&255, ln&255, body.length, ...body]};
}

// Split one text line into logical BASIC lines.
// "10 A=0  11 B=1  12 GOTO 10" → ["10 A=0", "11 B=1", "12 GOTO 10"]
// A new logical line starts where whitespace is followed by a run of digits
// and then a space/end, AND those digits form a number >= the previous one.
function splitLogicalLines(raw){
  // Strip comment first (apostrophe)
  const ci=raw.indexOf("'"); 
  const code = ci>=0 ? raw.slice(0,ci) : raw;
  const comment = ci>=0 ? raw.slice(ci) : '';
  const s=code.trimEnd();
  if(!s) return raw ? [raw] : [];

  // Find all positions where a new line number starts:
  // position is after whitespace, digits follow, then whitespace or end
  const cuts=[0];
  // regex: two+ spaces then digits then space (potential line number boundary)
  const re=/\s{2,}(\d+)(?=\s)/g;
  let m;
  while((m=re.exec(s))!==null){
    const num=parseInt(m[1],10);
    // only cut if number is reasonable (1..65534)
    if(num>=1&&num<=65534) cuts.push(m.index+m[0].length-m[1].length);
  }

  if(cuts.length===1){
    // single logical line — reattach comment to last segment
    return [s + (comment?' '+comment.trim():'')];
  }

  const result=[];
  for(let i=0;i<cuts.length;i++){
    const seg=s.slice(cuts[i], cuts[i+1]!==undefined ? cuts[i+1] : s.length).trim();
    if(!seg) continue;
    // attach comment only to last segment
    result.push(i===cuts.length-1 ? seg+(comment?' '+comment.trim():'') : seg);
  }
  return result;
}

function compile(text){
  const lines=text.split('\n');
  const all=[], errs=[], lmap={};
  for(let i=0;i<lines.length;i++){
    const raw=lines[i].trim();
    if(!raw||raw[0]==="'") continue;
    // split multi-statement lines: "10 X=0  11 Y=1" → two logical lines
    const logical=splitLogicalLines(raw);
    for(const seg of logical){
      if(!seg||seg[0]==="'") continue;
      const r=compileLine(seg);
      if(!r) continue;
      if(r.err){ errs.push({line:i+1,msg:r.err,type:'error'}); continue; }
      if(lmap[r.ln]!==undefined)
        errs.push({line:i+1,msg:'Дубль строки '+r.ln,type:'warn'});
      lmap[r.ln]=i;
      for(const b of r.bytes) all.push(b);
    }
  }
  all.push(0,0); // EOF marker
  return{bytes:new Uint8Array(all), errs};
}

// ═══════════════════ DECOMPILER ═══════════════════
const TNAME={};
for(const[k,v] of Object.entries(T)) TNAME[v]=k.replace('SETHSV','SET_HSV');

function decompile(bytes){
  const out=[]; let pc=0;
  while(pc+2<bytes.length){
    const hi=bytes[pc],lo=bytes[pc+1];
    if(!hi&&!lo) break;
    const ln=(hi<<8)|lo, len=bytes[pc+2];
    pc+=3;
    const end=pc+len, toks=[];
    while(pc<end){
      const b=bytes[pc++];
      if(b===T.EOL) break;
      if(b===T.VAR){ toks.push(String.fromCharCode(65+bytes[pc++])); continue; }
      if(b===T.NUM){ let v=(bytes[pc]<<8)|bytes[pc+1]; pc+=2; if(v>=32768)v-=65536; toks.push(''+v); continue; }
      if(b===T.COMMA){ toks.push(','); continue; }
      const n=TNAME[b]; if(n) toks.push(n);
    }
    pc=end;
    out.push(ln+' '+toks.join(' '));
  }
  return out.join('\n');
}

// ═══════════════════ VM ═══════════════════
class VM{
  constructor(bytes,n,onPx,onShow,onClear){
    this.b=bytes; this.n=n;
    this.onPx=onPx; this.onShow=onShow; this.onClear=onClear;
    this.vars=new Int16Array(26);
    this.cstack=[]; this.fstack=[];
    this.pc=0; this.state='stop'; this.wu=0; this.speed=100;
    // frame buffer для FADE/MIRROR
    this.fbuf=new Uint8Array(n*3);
    // build line index: lineNum -> bodyStart
    this.idx={}; let pp=0;
    while(pp+2<bytes.length){
      const hi=bytes[pp],lo=bytes[pp+1];
      if(!hi&&!lo) break;
      this.idx[(hi<<8)|lo]=pp+3;
      pp+=3+bytes[pp+2];
    }
    // sorted line numbers for sequential execution
    this.lineNums=Object.keys(this.idx).map(Number).sort((a,b)=>a-b);
    // bodyEnd: lineNum -> one past last byte of body (including EOL)
    this.bodyEnd={};
    pp=0;
    while(pp+2<bytes.length){
      const hi=bytes[pp],lo=bytes[pp+1];
      if(!hi&&!lo) break;
      const ln=(hi<<8)|lo, len=bytes[pp+2];
      this.bodyEnd[ln]=pp+3+len;
      pp+=3+len;
    }
  }

  play(){
    this.vars.fill(0); this.cstack=[]; this.fstack=[];
    if(!this.lineNums.length){this.state='stop';return;}
    this.curLine=0; // index into lineNums
    this.pc=this.idx[this.lineNums[0]];
    this.state='run';
    this.fbuf.fill(0);
  }

  stop(){ this.state='stop'; this.onClear(); this.fbuf.fill(0); }
  setSpeed(s){ this.speed=Math.max(1,Math.min(1000,s)); }
  asp(ms){ return ms<=0?0:Math.round(ms*100/this.speed); }

  // setpx: записывает пиксель в fbuf И вызывает onPx
  setpx(pos,r,g,b){
    if(pos>=0&&pos<this.n){
      this.onPx(pos,r,g,b);
      const idx=pos*3; this.fbuf[idx]=r; this.fbuf[idx+1]=g; this.fbuf[idx+2]=b;
    }
  }

  // fetch one byte
  f(){ return this.b[this.pc++]; }
  // fetch int16 big-endian
  i16(){ let v=(this.b[this.pc]<<8)|this.b[this.pc+1]; this.pc+=2; return v>=32768?v-65536:v; }

  // find body start for a line number
  line(n){ return this.idx[n]; }

  // skip to end of current line body (past EOL), advance curLine
  skipLine(){
    const ln=this.lineNums[this.curLine];
    if(ln!==undefined) this.pc=this.bodyEnd[ln];
    this.advanceLine();
  }

  // move to next sequential line
  advanceLine(){
    this.curLine++;
    if(this.curLine>=this.lineNums.length){ this.state='stop'; return; }
    this.pc=this.idx[this.lineNums[this.curLine]];
  }

  // jump to a line number (for GOTO/GOSUB)
  jumpTo(ln){
    const bp=this.line(ln);
    if(bp===undefined){ this.state='stop'; return false; }
    // find curLine index
    const idx=this.lineNums.indexOf(ln);
    if(idx<0){ this.state='stop'; return false; }
    this.curLine=idx;
    this.pc=bp;
    return true;
  }

  // scan past EOL token in body (used inside IF THEN to skip rest of line)
  scanToEOL(){
    while(this.pc<this.b.length){
      const b=this.b[this.pc];
      if(b===T.EOL){ this.pc++; return; }
      if(b===T.NUM){ this.pc+=3; continue; }
      if(b===T.VAR){ this.pc+=2; continue; }
      this.pc++;
    }
  }

  // expression evaluator
  expr(){ return this.addSub(); }
  addSub(){
    let v=this.mulDiv();
    for(;;){
      const op=this.b[this.pc];
      if(op===T.PLUS){  this.pc++; v=s16(v+this.mulDiv()); }
      else if(op===T.MINUS){ this.pc++; v=s16(v-this.mulDiv()); }
      else if(op===T.AND){  this.pc++; v=s16(v&this.mulDiv()); }
      else if(op===T.OR){   this.pc++; v=s16(v|this.mulDiv()); }
      else break;
    }
    return v;
  }
  mulDiv(){
    let v=this.unary();
    for(;;){
      const op=this.b[this.pc];
      if(op===T.MUL){ this.pc++; v=s16(v*this.unary()); }
      else if(op===T.DIV){ this.pc++; const d=this.unary(); v=d?s16(Math.trunc(v/d)):0; }
      else if(op===T.MOD){ this.pc++; const d=this.unary(); v=d?s16(v%d):0; }
      else break;
    }
    return v;
  }
  unary(){
    if(this.b[this.pc]===T.MINUS){ this.pc++; return s16(-this.primary()); }
    return this.primary();
  }
  primary(){
    const op=this.f();
    if(op===T.NUM)  return this.i16();
    if(op===T.VAR)  return this.vars[this.f()];
    if(op===T.RND){ const a=this.expr(); this.f()/*COMMA*/; const b=this.expr(); return s16(a+Math.floor(Math.random()*(b-a+1))); }
    if(op===T.ABS)  return s16(Math.abs(this.expr()));
    if(op===T.MIN){ const a=this.expr(); this.f(); const b=this.expr(); return s16(Math.min(a,b)); }
    if(op===T.MAX){ const a=this.expr(); this.f(); const b=this.expr(); return s16(Math.max(a,b)); }
    if(op===T.SIN8) return s16(sin8(this.expr()&255));
    if(op===T.COS8) return s16(cos8(this.expr()&255));
    if(op===T.NOISE){ const x=this.expr(); this.f()/*COMMA*/; const t=this.expr(); return s16(inoise8(x&0xFFFF, t&0xFFFF)); }
    if(op===T.PIXEL) return s16(this.n-1);
    if(op===T.EXP8){ return s16(exp8(this.expr())); }
    if(op===T.CONSTRAIN){
      const v=this.expr(); this.f(); const lo=this.expr(); this.f(); const hi=this.expr();
      return s16(v<lo?lo:v>hi?hi:v);
    }
    if(op===T.MAP){
      const val=this.expr(); this.f();
      const i0=this.expr();  this.f();
      const i1=this.expr();  this.f();
      const o0=this.expr();  this.f();
      const o1=this.expr();
      if(i1===i0) return s16(o0);
      return s16(Math.trunc((val-i0)*(o1-o0)/(i1-i0))+o0);
    }
    if(op===T.LPAREN){
      const v=this.expr();
      if(this.b[this.pc]===T.RPAREN) this.pc++;
      return v;
    }
    return 0;
  }

  hsv(h,s,v){
    h=((h%256)+256)%256; s=clamp(s); v=clamp(v);
    if(!s) return[v,v,v];
    const reg=h/43|0, rem=(h-reg*43)*6;
    const p=v*(255-s)/255+.5|0;
    const q=v*(255-(s*rem>>8))/255+.5|0;
    const t=v*(255-(s*(255-rem)>>8))/255+.5|0;
    switch(reg%6){case 0:return[v,t,p];case 1:return[q,v,p];case 2:return[p,v,t];case 3:return[p,q,v];case 4:return[t,p,v];default:return[v,p,q];}
  }

  // execute one statement from current pc, return 'yield' if WAIT/DELAY
  execStmt(){
    const op=this.f();
    switch(op){
      case T.EOL: this.advanceLine(); return 'next';
      case T.EOF: this.state='stop'; return 'stop';

      case T.VAR:{
        const vi=this.f(); this.f()/*ASSIGN*/; this.vars[vi]=s16(this.expr());
        break;
      }
      case T.SET:{
        const pos=this.expr(); this.f()/*,*/;
        const r=this.expr(); this.f()/*,*/;
        const g=this.expr(); this.f()/*,*/;
        const bv=this.expr();
        this.setpx(pos,clamp(r),clamp(g),clamp(bv));
        break;
      }
      case T.SETHSV:{
        const pos=this.expr(); this.f();
        const h=this.expr(); this.f();
        const sv=this.expr(); this.f();
        const v=this.expr();
        if(pos>=0&&pos<this.n){const[r,g,b]=this.hsv(h,sv,v);this.setpx(pos,r,g,b);}
        break;
      }
      case T.CLEAR: this.onClear(); this.fbuf.fill(0); break;
      case T.FILL:{
        const r=this.expr(); this.f();
        const g=this.expr(); this.f();
        const bv=this.expr();
        for(let i=0;i<this.n;i++) this.setpx(i,clamp(r),clamp(g),clamp(bv));
        break;
      }
      case T.SHOW: this.onShow(); break;
      case T.WAIT:{
        const ms=this.expr();
        this.onShow();
        this.wu=Date.now()+this.asp(ms);
        this.state='wait';
        return 'yield';
      }
      case T.DELAY:{
        const ms=this.expr();
        this.wu=Date.now()+this.asp(ms);
        this.state='wait';
        return 'yield';
      }
      case T.GOTO:{
        const ln=this.expr();
        this.jumpTo(ln);
        return 'next';
      }
      case T.GOSUB:{
        const ln=this.expr();
        if(this.cstack.length<10){
          // save return: next sequential line after current
          this.cstack.push({curLine:this.curLine, pc:this.pc});
          // skip rest of current line body
          this.scanToEOL();
          this.jumpTo(ln);
        }
        return 'next';
      }
      case T.RETURN:{
        if(this.cstack.length){
          const ret=this.cstack.pop();
          this.curLine=ret.curLine;
          this.pc=ret.pc;
          // skip to end of the GOSUB line (after return we continue after the GOSUB line)
          this.scanToEOL();
          this.advanceLine();
        } else this.state='stop';
        return 'next';
      }
      case T.FOR:{
        this.f()/*VAR*/; const vi=this.f();
        this.f()/*ASSIGN*/; const sv=s16(this.expr());
        this.vars[vi]=sv;
        this.f()/*TO*/; const ev=s16(this.expr());
        let stv=1;
        if(this.b[this.pc]===T.STEP){ this.f(); stv=s16(this.expr()); }
        // skip EOL, advance to next line (body of loop)
        this.scanToEOL();
        this.advanceLine();
        this.fstack.push({vi,ev,stv,curLine:this.curLine,pc:this.pc});
        return 'next';
      }
      case T.NEXT:{
        this.f()/*VAR*/; const vi=this.f();
        if(!this.fstack.length) break;
        const fr=this.fstack[this.fstack.length-1];
        this.vars[fr.vi]=s16(this.vars[fr.vi]+fr.stv);
        const cont=fr.stv>=0?this.vars[fr.vi]<=fr.ev:this.vars[fr.vi]>=fr.ev;
        if(cont){ this.curLine=fr.curLine; this.pc=fr.pc; }
        else this.fstack.pop();
        return 'next';
      }
      case T.IF:{
        const lv=this.expr();
        const rop=this.f();
        const rv=this.expr();
        if(this.b[this.pc]===T.THEN) this.f();
        let cond=false;
        switch(rop){
          case T.EQ:cond=lv===rv;break; case T.NEQ:cond=lv!==rv;break;
          case T.GT:cond=lv>rv;break;   case T.LT:cond=lv<rv;break;
          case T.GE:cond=lv>=rv;break;  case T.LE:cond=lv<=rv;break;
        }
        if(cond){
          const r=this.execThen();
          if(r!=='jumped'){ this.scanToEOL(); this.advanceLine(); }
          return 'next';
        } else {
          this.scanToEOL(); this.advanceLine();
        }
        return 'next';
      }
      case T.BRIGHT: this.expr(); break;
      case T.FADE:{
        const pos=this.expr(); this.f()/*COMMA*/; const amt=this.expr();
        if(pos>=0&&pos<this.n&&this.fbuf){
          const idx=pos*3;
          const a=Math.max(0,Math.min(255,amt));
          const r=Math.max(0,this.fbuf[idx]  -a);
          const g=Math.max(0,this.fbuf[idx+1]-a);
          const b=Math.max(0,this.fbuf[idx+2]-a);
          this.setpx(pos,r,g,b);
          this.fbuf[idx]=r; this.fbuf[idx+1]=g; this.fbuf[idx+2]=b;
        }
        break;
      }
      case T.MIRROR:{
        if(this.fbuf){
          const half=this.n>>1;
          for(let i=0;i<half;i++){
            const src=i*3;
            const dst=this.n-1-i;
            this.setpx(dst,this.fbuf[src],this.fbuf[src+1],this.fbuf[src+2]);
          }
        }
        break;
      }
      default: break;
    }
    return 'ok';
  }

  execThen(){
    const op=this.f();
    switch(op){
      case T.VAR:{
        const vi=this.f(); this.f()/*ASSIGN*/; this.vars[vi]=s16(this.expr()); break;
      }
      case T.SET:{
        const pos=this.expr(); this.f();
        const r=this.expr(); this.f();
        const g=this.expr(); this.f();
        const bv=this.expr();
        this.setpx(pos,clamp(r),clamp(g),clamp(bv));
        break;
      }
      case T.SETHSV:{
        const pos=this.expr(); this.f();
        const h=this.expr(); this.f();
        const sv=this.expr(); this.f();
        const v=this.expr();
        if(pos>=0&&pos<this.n){const[r,g,b]=this.hsv(h,sv,v);this.setpx(pos,r,g,b);}
        break;
      }
      case T.CLEAR: this.onClear(); this.fbuf.fill(0); break;
      case T.FADE:{
        const pos=this.expr(); this.f(); const amt=this.expr();
        if(pos>=0&&pos<this.n&&this.fbuf){
          const idx=pos*3, a=Math.max(0,Math.min(255,amt));
          this.setpx(pos,Math.max(0,this.fbuf[idx]-a),Math.max(0,this.fbuf[idx+1]-a),Math.max(0,this.fbuf[idx+2]-a));
        }
        break;
      }
      case T.MIRROR:{
        if(this.fbuf){
          const half=this.n>>1;
          for(let i=0;i<half;i++){
            const src=i*3;
            this.setpx(this.n-1-i,this.fbuf[src],this.fbuf[src+1],this.fbuf[src+2]);
          }
        }
        break;
      }
      case T.GOTO:{
        const ln=this.expr(); this.jumpTo(ln); return 'jumped';
      }
      case T.GOSUB:{
        const ln=this.expr();
        if(this.cstack.length<10){
          this.cstack.push({curLine:this.curLine,pc:this.pc});
          this.scanToEOL();
          this.jumpTo(ln);
        }
        return 'jumped';
      }
      case T.RETURN:{
        if(this.cstack.length){
          const ret=this.cstack.pop();
          this.curLine=ret.curLine; this.pc=ret.pc;
          this.scanToEOL(); this.advanceLine();
        } else this.state='stop';
        return 'jumped';
      }
    }
    return 'ok';
  }

  step(){
    if(this.state==='stop') return false;
    if(this.state==='wait'){
      if(Date.now()>=this.wu) this.state='run';
      else return true;
    }
    let budget=2000;
    while(this.state==='run'&&budget-->0){
      const r=this.execStmt();
      if(r==='yield'||r==='stop') return r==='yield';
    }
    return false;
  }
}

// ═══════════════════ EMULATOR ═══════════════════
const ecanv=document.getElementById('ecanv');
const ectx=ecanv.getContext('2d');
let epx=null;
let cfg={fs:13,tab:2,ac:true,ns:10,nst:10,speed:100,brightness:255,expMode:'cs'};

function onShapeChange(){
  const shape=document.getElementById('eshape').value;
  const isMat=shape==='matrix';
  document.getElementById('row-px').style.display=isMat?'none':'flex';
  document.getElementById('row-mw').style.display=isMat?'flex':'none';
  document.getElementById('row-mh').style.display=isMat?'flex':'none';
  resizeEmu();
}

function getEmuParams(){
  const shape=document.getElementById('eshape').value;
  const sc=+document.getElementById('escale').value||11;
  let n,cols,rows;
  if(shape==='matrix'){
    cols=+document.getElementById('emw').value||16;
    rows=+document.getElementById('emh').value||16;
    n=cols*rows;
  } else {
    n=+document.getElementById('ec').value||32;
    cols=n; rows=1;
  }
  return{shape,sc,n,cols,rows};
}

function resizeEmu(){
  const{shape,sc,n,cols,rows}=getEmuParams();
  epx=new Uint8Array(n*3);
  if(shape==='strip'){ ecanv.width=n*sc; ecanv.height=sc; }
  else if(shape==='ring'){
    const r=Math.max(n*sc/(2*Math.PI),sc*2);
    ecanv.width=ecanv.height=Math.ceil(r*2+sc*2);
  } else {
    ecanv.width=cols*sc; ecanv.height=rows*sc;
  }
  drawEmu();
}

function drawEmu(){
  const{shape,sc,n,cols}=getEmuParams();
  const br=cfg.brightness/255;
  const px=epx||new Uint8Array(n*3);
  ectx.clearRect(0,0,ecanv.width,ecanv.height);
  ectx.fillStyle='#070910'; ectx.fillRect(0,0,ecanv.width,ecanv.height);
  const r=(sc-Math.max(1,sc*0.12|0)*2)/2;
  for(let i=0;i<n;i++){
    const ri=px[i*3]*br+.5|0, gi=px[i*3+1]*br+.5|0, bi=px[i*3+2]*br+.5|0;
    let x,y;
    if(shape==='strip'){ x=i*sc+sc/2; y=sc/2; }
    else if(shape==='ring'){
      const ang=(i/n)*2*Math.PI-Math.PI/2;
      const rad=ecanv.width/2-sc;
      x=ecanv.width/2+rad*Math.cos(ang); y=ecanv.height/2+rad*Math.sin(ang);
    } else {
      x=(i%cols)*sc+sc/2; y=(i/cols|0)*sc+sc/2;
    }
    if(ri+gi+bi>6){
      const g=ectx.createRadialGradient(x,y,0,x,y,r*2.4);
      g.addColorStop(0,`rgba(${ri},${gi},${bi},0.4)`);
      g.addColorStop(1,'rgba(0,0,0,0)');
      ectx.fillStyle=g; ectx.beginPath(); ectx.arc(x,y,r*2.4,0,Math.PI*2); ectx.fill();
    }
    ectx.beginPath(); ectx.arc(x,y,r,0,Math.PI*2);
    ectx.fillStyle=`rgb(${ri},${gi},${bi})`; ectx.fill();
    ectx.strokeStyle='rgba(255,255,255,0.07)'; ectx.lineWidth=0.5; ectx.stroke();
  }
}

// ═══════════════════ EDITOR ═══════════════════
const ta=document.getElementById('ta');
const hlayer=document.getElementById('hlayer');
const gutterInner=document.getElementById('gutter-inner');
const escroll=document.getElementById('escroll');
const einner=document.getElementById('einner');
const curhl=document.getElementById('curhl');

let code='', errs=[], lintTimer=null;

// ── Sync textarea size with content ──
function syncSize(){
  // make einner tall enough so scrollbar appears on escroll, not ta
  const lines=code.split('\n');
  const lh=cfg.fs*1.6;
  const h=Math.max(escroll.clientHeight, lines.length*lh+20);
  const w=Math.max(escroll.clientWidth, Math.max(...lines.map(l=>l.length))*cfg.fs*0.6+30);
  einner.style.height=h+'px';
  einner.style.width=w+'px';
  ta.style.height=h+'px';
  ta.style.width=w+'px';
  hlayer.style.width=w+'px';
}

// ── Highlight ──
const LED_KW=new Set(['CLEAR','FILL','SET_HSV','SET','WAIT','DELAY','SHOW','BRIGHT','FADE','MIRROR']);
const FLOW_KW=new Set(['FOR','TO','STEP','NEXT','IF','THEN','GOTO','GOSUB','RETURN']);
const FN_KW=new Set(['RND','ABS','MIN','MAX','SIN8','COS8','NOISE','MAP','CONSTRAIN','EXP8','AND','OR','PIXEL']);

function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function hlLine(raw, hasErr, hasWrn){
  let s=raw, out='';
  // comment
  const ci=s.indexOf("'");
  let cmt='';
  if(ci>=0){ cmt=s.slice(ci); s=s.slice(0,ci); }

  // Split into logical sub-lines for highlighting (multi-statement support)
  // Each logical segment starts with a line number
  const segs = splitLogicalLines(s + (cmt ? "'"+cmt.slice(1) : ''));
  // if only one segment, process normally; if multiple, highlight each separately
  const renderSeg = (seg) => {
    let t=seg, res='';
    // strip comment from this segment
    const sc=t.indexOf("'"); let sc_str='';
    if(sc>=0){ sc_str=t.slice(sc); t=t.slice(0,sc); }
    // line number
    const nm=t.match(/^(\s*)(\d+)(.*)/);
    if(nm){ res+=`<span class="kx">${esc(nm[1]+nm[2])}</span>`; t=nm[3]; }
    // tokenize
    let p=0;
    while(p<t.length){
      if(t[p]===' '){ let w=''; while(p<t.length&&t[p]===' ') w+=t[p++]; res+=esc(w); continue; }
      const rem=t.slice(p);
      let hit=false;
      for(const[w,] of KW){
        if(rem.startsWith(w)){
          if(/[A-Z_]/.test(w[w.length-1])){
            const nx=t[p+w.length]; if(nx&&/[A-Z0-9_]/.test(nx)) continue;
          }
          const cls=LED_KW.has(w)?'kc':FLOW_KW.has(w)?'kf':FN_KW.has(w)?'kn':'ko';
          res+=`<span class="${cls}">${esc(w)}</span>`;
          p+=w.length; hit=true; break;
        }
      }
      if(hit) continue;
      if((t[p]==='-'&&p+1<t.length&&t[p+1]>='0'&&t[p+1]<='9')||(t[p]>='0'&&t[p]<='9')){
        let n=''; if(t[p]==='-') n+=t[p++];
        while(p<t.length&&t[p]>='0'&&t[p]<='9') n+=t[p++];
        res+=`<span class="km">${esc(n)}</span>`; continue;
      }
      if(t[p]>='A'&&t[p]<='Z'){
        const nx=t[p+1];
        if(!nx||!/[A-Z0-9_]/.test(nx)){
          res+=`<span class="kv">${t[p]}</span>`; p++; continue;
        }
      }
      res+=esc(t[p++]);
    }
    if(sc_str) res+=`<span class="kx">${esc(sc_str)}</span>`;
    return res;
  };

  if(segs.length<=1){
    out = renderSeg(s + (cmt ? cmt : ''));
  } else {
    // multiple logical lines on one text line — render each, separate with dim marker
    out = segs.map((seg,i) =>
      renderSeg(seg) + (i<segs.length-1 ? '<span style="opacity:.35">  </span>' : '')
    ).join('');
  }

  if(hasErr) return `<span class="kerr">${out}</span>`;
  if(hasWrn) return `<span class="kwrn">${out}</span>`;
  return out;
}

function updateHL(){
  const lines=code.split('\n');
  const byLine={};
  errs.forEach(e=>{ if(!byLine[e.line]) byLine[e.line]=[]; byLine[e.line].push(e); });
  hlayer.innerHTML=lines.map((l,i)=>{
    const ee=byLine[i+1];
    const hasE=ee&&ee.some(x=>x.type==='error');
    const hasW=ee&&!hasE;
    return hlLine(l,hasE,hasW);
  }).join('\n');
}

function updateGutter(){
  const lines=code.split('\n');
  const byLine={};
  errs.forEach(e=>{ if(!byLine[e.line]) byLine[e.line]=[]; byLine[e.line].push(e); });
  const lh=cfg.fs*1.6;
  gutterInner.innerHTML=lines.map((l,i)=>{
    const n=i+1;
    const ee=byLine[n];
    const cls='gln'+(ee?(ee.some(x=>x.type==='error')?' err':' wrn'):'');
    const tt=ee?ee.map(x=>x.msg).join('; '):'';
    return `<div class="${cls}" style="height:${lh}px;line-height:${lh}px" title="${esc(tt)}" onclick="goLine(${n})">${n}</div>`;
  }).join('');
}

function updateErrStatus(){
  const n=errs.filter(e=>e.type==='error').length;
  const el=document.getElementById('st-err');
  document.getElementById('st-ec').textContent=n;
  el.style.display=n?'':'none';
}

// ── lint ──
function lint(text){
  const lines=text.split('\n');
  const out=[], seen=new Set();
  for(let i=0;i<lines.length;i++){
    const raw=lines[i].trim();
    if(!raw||raw[0]==="'") continue;
    const r=compileLine(raw);
    if(!r) continue;
    if(r.err){ out.push({line:i+1,msg:r.err,type:'error'}); continue; }
    if(seen.has(r.ln)) out.push({line:i+1,msg:'Дубль строки '+r.ln,type:'warn'});
    seen.add(r.ln);
  }
  return out;
}

// ── cursor / selection ──
let curRow=1;
function onSelChange(){
  const pos=ta.selectionStart;
  const before=code.slice(0,pos);
  const ls=before.split('\n');
  curRow=ls.length;
  const col=ls[ls.length-1].length+1;
  document.getElementById('st-pos').textContent=`Стр ${curRow}, Кол ${col}`;
  document.getElementById('st-ln').textContent=code.split('\n').length+' строк';

  const lh=cfg.fs*1.6;
  curhl.style.top=(10+(curRow-1)*lh)+'px';
  curhl.style.height=lh+'px';

  // sync gutter active line
  gutterInner.querySelectorAll('.gln').forEach((el,i)=>{
    el.classList.toggle('cur',i+1===curRow);
  });

  // error tooltip
  const ee=errs.filter(e=>e.line===curRow);
  const tip=document.getElementById('errtip');
  if(ee.length){
    tip.textContent=ee.map(e=>e.msg).join('\n');
    tip.style.display='block';
    const rect=ta.getBoundingClientRect();
    const scrollTop=escroll.scrollTop;
    tip.style.left=(rect.left+50)+'px';
    tip.style.top=(rect.top+(curRow-1)*lh-scrollTop+lh+8)+'px';
  } else tip.style.display='none';
}

function onScroll(){
  const st=escroll.scrollTop, sl=escroll.scrollLeft;
  // sync gutter vertical scroll
  gutterInner.style.top=(-st)+'px';
  // sync highlight layer (it's already absolutely positioned inside einner which scrolls)
  // ta scrolls with escroll, hlayer is sibling — both inside einner, no transform needed
  // just keep gutter in sync
}

function onInput(){
  code=ta.value;
  document.getElementById('tab-dirty').style.display='';
  syncSize();
  updateHL();
  updateGutter();
  clearTimeout(lintTimer);
  lintTimer=setTimeout(()=>{
    errs=lint(code);
    updateHL();
    updateGutter();
    updateErrStatus();
    updateVarView();
  },300);
  onSelChange();
}

function goLine(n){
  const ls=code.split('\n');
  let pos=0;
  for(let i=0;i<Math.min(n-1,ls.length);i++) pos+=ls[i].length+1;
  ta.focus(); ta.setSelectionRange(pos,pos);
  onSelChange();
  // scroll to line
  const lh=cfg.fs*1.6;
  escroll.scrollTop=Math.max(0,(n-3)*lh);
}

// ── keyboard ──
const acEl=document.getElementById('acp');
const ACL=[
  {l:'FOR',t:'flow',s:'FOR  = 0 TO 31'},{l:'NEXT',t:'flow',s:'NEXT '},
  {l:'IF',t:'flow',s:'IF  THEN '},{l:'GOTO',t:'flow',s:'GOTO '},
  {l:'GOSUB',t:'flow',s:'GOSUB '},{l:'RETURN',t:'flow',s:'RETURN'},
  {l:'SET_HSV',t:'led',s:'SET_HSV  , 0 , 255 , 200'},
  {l:'SET',t:'led',s:'SET  , 255 , 0 , 0'},
  {l:'FILL',t:'led',s:'FILL 255 , 0 , 0'},
  {l:'CLEAR',t:'led',s:'CLEAR'},
  {l:'WAIT',t:'led',s:'WAIT 20'},
  {l:'DELAY',t:'led',s:'DELAY 500'},
  {l:'SHOW',t:'led',s:'SHOW'},
  {l:'FADE',t:'led',s:'FADE  , 30'},
  {l:'MIRROR',t:'led',s:'MIRROR'},
  {l:'ABS',t:'fn',s:'ABS '},
  {l:'SIN8',t:'fn',s:'SIN8 '},
  {l:'COS8',t:'fn',s:'COS8 '},
  {l:'NOISE',t:'fn',s:'NOISE  , '},
  {l:'EXP8',t:'fn',s:'EXP8 '},
  {l:'MAP',t:'fn',s:'MAP  , 0 , 255 , 0 , 255'},
  {l:'CONSTRAIN',t:'fn',s:'CONSTRAIN  , 0 , 255'},
  {l:'MIN',t:'fn',s:'MIN  , '},
  {l:'MAX',t:'fn',s:'MAX  , '},
  {l:'PIXEL',t:'fn',s:'PIXEL'},
];
let acItems=[], acSel=0;

function showAC(){
  if(!cfg.ac) return;
  const pos=ta.selectionStart;
  const before=code.slice(0,pos);
  const m=before.match(/([A-Z_]{2,})$/);
  if(!m){ hideAC(); return; }
  const word=m[1];
  acItems=ACL.filter(a=>a.l.startsWith(word)&&a.l!==word);
  if(!acItems.length){ hideAC(); return; }
  acSel=0;
  const cols={led:'var(--ac)',flow:'var(--pu)',fn:'var(--ye)'};
  acEl.innerHTML=acItems.map((a,i)=>
    `<div class="aci${i===0?' sel':''}" onclick="insertAC(${i})" onmouseenter="acSel=${i};renderAC()">
      <span style="color:${cols[a.t]}">${a.l}</span><span class="act">${a.t}</span>
    </div>`).join('');
  // position
  const rect=ta.getBoundingClientRect();
  const lines=before.split('\n');
  const row=lines.length-1;
  const col=lines[lines.length-1].length;
  const lh=cfg.fs*1.6, cw=cfg.fs*0.6;
  const x=rect.left+46+col*cw-escroll.scrollLeft;
  const y=rect.top+row*lh-escroll.scrollTop;
  acEl.style.cssText=`display:block;left:${x}px;top:${y+lh+2}px`;
}
function renderAC(){
  acEl.querySelectorAll('.aci').forEach((e,i)=>e.classList.toggle('sel',i===acSel));
}
function hideAC(){ acEl.style.display='none'; acItems=[]; }
function insertAC(i){
  const it=acItems[i];
  const pos=ta.selectionStart;
  const before=code.slice(0,pos);
  const m=before.match(/([A-Z_]+)$/);
  if(!m){ hideAC(); return; }
  const from=pos-m[1].length;
  ta.focus();
  ta.setSelectionRange(from,pos);
  document.execCommand('insertText',false,it.s);
  hideAC();
}
document.addEventListener('click',e=>{
  if(!acEl.contains(e.target)) hideAC();
  if(!document.getElementById('errtip').contains(e.target))
    document.getElementById('errtip').style.display='none';
});

function onKeyDown(e){
  if(acEl.style.display==='block'){
    if(e.key==='ArrowDown'){ e.preventDefault(); acSel=Math.min(acSel+1,acItems.length-1); renderAC(); return; }
    if(e.key==='ArrowUp'){   e.preventDefault(); acSel=Math.max(acSel-1,0); renderAC(); return; }
    if(e.key==='Tab'||e.key==='Enter'){ e.preventDefault(); insertAC(acSel); return; }
    if(e.key==='Escape'){ hideAC(); return; }
  }
  if(e.key==='Tab'){
    e.preventDefault();
    document.execCommand('insertText',false,' '.repeat(cfg.tab));
    return;
  }
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){ e.preventDefault(); doSave(); return; }
  if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){ e.preventDefault(); toggleRun(); return; }
  if(e.key==='F5'){ e.preventDefault(); toggleRun(); return; }
}
ta.addEventListener('input',showAC);

// ═══════════════════ RUN / VM ═══════════════════
let vm=null, running=false, raf=null, fpsF=0, fpsT=0;

function toggleRun(){ running?doStop():doRun(); }

function doRun(){
  const res=compile(code);
  if(res.errs.filter(e=>e.type==='error').length){
    lg('⚠ Ошибки компиляции — исправь перед запуском','e');
    res.errs.filter(e=>e.type==='error').forEach(e=>lg('  Стр '+e.line+': '+e.msg,'e'));
    return;
  }
  lg('✓ Компиляция OK — '+res.bytes.length+' байт','o');
  updateByView(res.bytes);
  const {n}=getEmuParams();
  epx=new Uint8Array(n*3);
  vm=new VM(res.bytes,n,
    (p,r,g,b)=>{ if(p*3+2<epx.length){epx[p*3]=r;epx[p*3+1]=g;epx[p*3+2]=b;} },
    ()=>drawEmu(),
    ()=>{ epx.fill(0); drawEmu(); }
  );
  vm.setSpeed(cfg.speed);
  vm.play();
  if(vm.state==='stop'){ lg('Программа пустая или не запустилась','w'); return; }
  running=true; fpsF=0; fpsT=Date.now();
  document.getElementById('runbtn').classList.add('stop');
  document.getElementById('ricon').innerHTML='<rect x="4" y="3" width="3" height="10"/><rect x="9" y="3" width="3" height="10"/>';
  document.getElementById('rtxt').textContent='СТОП';
  loop();
}

function doStop(){
  running=false;
  if(raf){ cancelAnimationFrame(raf); raf=null; }
  if(vm) vm.stop();
  vm=null;
  document.getElementById('runbtn').classList.remove('stop');
  document.getElementById('ricon').innerHTML='<path d="M4 3l10 5-10 5V3z"/>';
  document.getElementById('rtxt').textContent='ЗАПУСК';
  document.getElementById('efps').textContent='— FPS';
  drawEmu();
}

function loop(){
  if(!running){ raf=null; return; }
  if(vm){
    vm.step();
    if(vm.state==='stop'){ doStop(); return; }
  }
  fpsF++;
  const now=Date.now();
  if(now-fpsT>=600){
    document.getElementById('efps').textContent=(fpsF*1000/(now-fpsT)|0)+' FPS';
    fpsF=0; fpsT=now;
    if(curBot==='var') updateVarView();
  }
  raf=requestAnimationFrame(loop);
}

// ═══════════════════ BOTTOM TABS ═══════════════════
let curBot='con';
function showBot(n){
  curBot=n;
  const panelMap={'con':'con','by':'byv','var':'varv'};
  ['con','by','var'].forEach(id=>{
    const el=document.getElementById(panelMap[id]);
    if(el) el.style.display=(id===n)?'block':'none';
    const tab=document.getElementById('bt-'+id);
    if(tab) tab.classList.toggle('on',id===n);
  });
  if(n==='var') updateVarView();
  if(n==='by'&&lastBytes) updateByView(lastBytes);
}

function lg(msg,t=''){
  const el=document.getElementById('con');
  const ts=new Date().toTimeString().slice(0,8);
  const cls={e:'le',w:'lw',o:'lo',i:'li'}[t]||'';
  el.innerHTML+=`<div class="${cls}"><span style="color:var(--t3)">[${ts}]</span> ${esc(''+msg)}</div>`;
  el.scrollTop=el.scrollHeight;
}

let lastBytes=null;
function updateByView(bytes){
  lastBytes=bytes;
  let s=`<span style="color:var(--t3)">Размер: ${bytes.length} байт</span>\n\n`;
  let pc=0;
  while(pc+2<bytes.length){
    const hi=bytes[pc],lo=bytes[pc+1];
    if(!hi&&!lo){ s+=`<span style="color:var(--t3)">EOF</span>`; break; }
    const ln=(hi<<8)|lo, len=bytes[pc+2];
    const body=Array.from(bytes.slice(pc+3,pc+3+len)).map(b=>b.toString(16).padStart(2,'0')).join(' ');
    s+=`<span style="color:var(--t3)">${(''+pc).padStart(4)}</span>  `+
       `<span style="color:var(--pu)">${hi.toString(16).padStart(2,'0')} ${lo.toString(16).padStart(2,'0')}</span> `+
       `<span style="color:var(--t2)">[${(''+len).padStart(3)}]</span> `+
       `<span style="color:var(--t1)">${body}</span>  `+
       `<span style="color:var(--t3)">; стр ${ln}</span>\n`;
    pc+=3+len;
  }
  document.getElementById('byv').innerHTML=s;
}

function getUsedVars(){
  const used=new Set();
  const lines=code.split('\n');
  for(let line of lines){
    let s=line.trim(); if(!s) continue;
    const ci=s.indexOf("'"); if(ci>=0) s=s.slice(0,ci);
    // find standalone A-Z
    const ms=s.matchAll(/(?<![A-Z0-9_])([A-Z])(?![A-Z0-9_])/g);
    for(const m of ms) used.add(m[1].charCodeAt(0)-65);
  }
  return used;
}

function updateVarView(){
  const used=getUsedVars();
  document.getElementById('varv').innerHTML=
    Array.from({length:26},(_,i)=> {
      const v = vm ? vm.vars[i] : 0;
      const isUsed = used.has(i);
      return `<div class="vi${isUsed?' used':''}"><div class="vn">${String.fromCharCode(65+i)}</div><div class="vv">${v}</div></div>`;
    }).join('');
}

// ═══════════════════ FILES ═══════════════════
let fname='untitled.bas';
const tabnameEl=document.getElementById('tabname');
tabnameEl.addEventListener('change',()=>{
  let v=tabnameEl.value.trim();
  if(!v) v='untitled.bas';
  if(!/\.bas$/.test(v)) v=v.replace(/\.[^.]*$/,'')+'.bas';
  fname=v; tabnameEl.value=fname;
});
tabnameEl.addEventListener('keydown',e=>{
  if(e.key==='Enter'||e.key==='Escape'){ e.preventDefault(); ta.focus(); }
});

function newFile(){
  const doNew=()=>{
    ta.value=''; code=''; fname='untitled.bas';
    tabnameEl.value=fname;
    document.getElementById('tab-dirty').style.display='none';
    errs=[]; onInput(); lg('Новый файл','i');
  };
  if(code.trim()) showConfirm('Новый файл','Изменения будут потеряны.',doNew);
  else doNew();
}

function showConfirm(title,msg,onOk){
  document.getElementById('cfm-title').textContent=title;
  document.getElementById('cfm-msg').textContent=msg;
  document.getElementById('cfm-ok').onclick=()=>{ hideModal(); onOk(); };
  showModal('m-cfm');
}

function openFile(){ document.getElementById('fopen').click(); }

function onFileOpen(e){
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  const isBin=f.name.endsWith('.bin');
  if(isBin) r.readAsArrayBuffer(f); else r.readAsText(f,'utf-8');
  r.onload=ev=>{
    if(isBin){
      const b=new Uint8Array(ev.target.result);
      ta.value=decompile(b); lg('Открыт .bin: '+f.name+' ('+b.length+' байт) → декомпилирован','o');
    } else { ta.value=ev.target.result; lg('Открыт: '+f.name,'o'); }
    fname=f.name.replace('.bin','.bas'); code=ta.value;
    tabnameEl.value=fname;
    document.getElementById('tab-dirty').style.display='none';
    errs=[]; onInput();
  };
  e.target.value='';
}

function doSave(){
  fname=tabnameEl.value.trim()||'untitled.bas';
  tabnameEl.value=fname;
  const blob=new Blob([code],{type:'text/plain'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=fname; a.click();
  document.getElementById('tab-dirty').style.display='none';
  notify('Сохранено: '+fname,'ok'); lg('Сохранено: '+fname,'o');
}

// ═══════════════════ FORMAT ═══════════════════
function doFormat(){
  const saved=ta.selectionStart;
  ta.value=code.split('\n').map(line=>{
    let s=line.trim(); if(!s) return '';
    const ci=s.indexOf("'"); let cmt=''; if(ci>=0){ cmt=' '+s.slice(ci); s=s.slice(0,ci).trimEnd(); }
    if(!s) return cmt.trim();
    // uppercase keywords
    for(const[w] of KW){
      if(!/^[A-Z]/.test(w)) continue;
      const re=new RegExp('(?<![A-Z0-9_])'+w+'(?![A-Z0-9_])','g');
      s=s.replace(re,w);
    }
    // normalize commas and operators spacing
    s=s.replace(/\s*,\s*/g,' , ')
       .replace(/\s*(==|!=|>=|<=)\s*/g,' $1 ')
       .replace(/\s+/g,' ').trim();
    return s+(cmt||'');
  }).join('\n');
  code=ta.value; onInput(); notify('Отформатировано','ok');
}

// ═══════════════════ AUTO NUMBER ═══════════════════
function showAutoNum(){
  document.getElementById('an-s').value=cfg.ns;
  document.getElementById('an-st').value=cfg.nst;
  showModal('m-an');
}

function applyAutoNum(){
  const start=+document.getElementById('an-s').value||10;
  const step=+document.getElementById('an-st').value||10;
  const renumber=document.getElementById('an-re').checked;
  let n=start;
  ta.value=code.split('\n').map(line=>{
    const t=line.trim(); if(!t||t[0]==="'") return line;
    if(renumber){
      const m=t.match(/^(\d+)\s*(.*)/);
      const body=m?m[2]:t;
      const r=n+' '+body; n+=step; return r;
    } else {
      if(/^\d/.test(t)) return line;
      const r=n+' '+t; n+=step; return r;
    }
  }).join('\n');
  code=ta.value; onInput(); hideModal(); notify('Нумерация применена','ok');
}

// ═══════════════════ EXPORT ═══════════════════
let compiledBytes=null;

function showExport(){
  const res=compile(code);
  if(res.errs.filter(e=>e.type==='error').length){ notify('Исправь ошибки перед экспортом','err'); return; }
  compiledBytes=res.bytes;
  cfg.expMode='cs';
  ['cs','pm','bas','bin'].forEach(m=>document.getElementById('et-'+m).classList.toggle('on',m==='cs'));
  renderExport();
  showModal('m-exp');
}

function setExpMode(m){
  cfg.expMode=m;
  ['cs','pm','bas','bin'].forEach(id=>document.getElementById('et-'+id).classList.toggle('on',id===m));
  renderExport();
}

function renderExport(){
  if(!compiledBytes) return;
  const vn=(fname.replace(/\.[^.]+$/,'')||'script').replace(/[^a-zA-Z0-9_]/g,'_');
  const ls=code.split('\n').filter(l=>l.trim());
  let out='';
  if(cfg.expMode==='cs'){
    out=`const char* ${vn} =\n`+ls.map(l=>`    "${l.replace(/\\/g,'\\\\').replace(/"/g,'\\"')}\\n"`).join('\n')+';';
  } else if(cfg.expMode==='pm'){
    out=`const char ${vn}[] PROGMEM =\n`+ls.map(l=>`    "${l.replace(/\\/g,'\\\\').replace(/"/g,'\\"')}\\n"`).join('\n')+';';
  } else if(cfg.expMode==='bas'){
    out=code;
  } else {
    const hex=Array.from(compiledBytes).map(b=>b.toString(16).padStart(2,'0'));
    out=`// ${vn}.bin — ${compiledBytes.length} bytes\nconst uint8_t ${vn}_bin[] PROGMEM = {\n`;
    for(let i=0;i<hex.length;i+=16) out+='  '+hex.slice(i,i+16).map(h=>'0x'+h).join(', ')+',\n';
    out+=`};\nconst uint16_t ${vn}_bin_size = ${compiledBytes.length};`;
  }
  document.getElementById('expc').textContent=out;
}

function copyExport(){
  navigator.clipboard.writeText(document.getElementById('expc').textContent).then(()=>notify('Скопировано!','ok'));
}

function dlExport(){
  if(!compiledBytes) return;
  const vn=fname.replace(/\.[^.]+$/,'')||'script';
  if(cfg.expMode==='bin'){
    const b=new Blob([compiledBytes],{type:'application/octet-stream'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=vn+'.bin'; a.click();
  } else {
    const txt=document.getElementById('expc').textContent;
    const ext=cfg.expMode==='bas'?'.bas':'.cpp';
    const b=new Blob([txt],{type:'text/plain'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=vn+ext; a.click();
  }
  notify('Скачивается...','ok');
}

// ═══════════════════ SETTINGS ═══════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  ПРИМЕРЫ
// ══════════════════════════════════════════════════════════════════════════════
const EXAMPLES = [
  { cat:'Начало' },
  { name:'Статичный цвет',    desc:'Все пиксели одним цветом',
    code:`10 FILL 255 , 80 , 0    ' залить лентуа оранжевым
20 SHOW                    ' вывести на ленту
30 DELAY 1000              ' ждать 1 секунду (без Show)
40 GOTO 30                 ' бесконечное ожидание` },
  { name:'Мигание',           desc:'Лента мигает с частотой 1 Гц',
    code:`10 FILL 0 , 0 , 255     ' синий
20 WAIT 500                ' показать и подождать
30 CLEAR                   ' погасить
40 WAIT 500
50 GOTO 10` },
  { name:'Плавное дыхание',   desc:'Яркость пульсирует по синусу',
    code:`10 T = 0
20 V = SIN8 T              ' синус → 0..255
30 V = EXP8 V              ' гамма-коррекция (естественнее)
40 FILL 200 , 60 , V
50 WAIT 14
60 T = T + 2
70 IF T > 255 THEN T = 0
80 GOTO 20` },
  { name:'Радуга',            desc:'Полный спектр по всей ленте',
    code:`10 H = 0
20 FOR I = 0 TO PIXEL
30   C = H + I * 256 / PIXEL
40   SET_HSV I , C , 255 , 180
50 NEXT I
60 WAIT 30
70 H = H + 3
80 IF H > 255 THEN H = H - 256
90 GOTO 20` },
  { cat:'Движение' },
  { name:'Комета',            desc:'Хвост с затуханием, меняет цвет',
    code:`10 H = 0
20 P = 0
30 CLEAR
40 V = 160
50 FOR T = 1 TO 8
60   Q = P - T
70   IF Q >= 0 THEN SET_HSV Q , H , 255 , V
80   V = V * 3 / 4
90 NEXT T
100 SET P , 255 , 255 , 255
110 WAIT 25
120 P = P + 1
130 IF P <= PIXEL THEN GOTO 30
140 CLEAR
150 WAIT 200
160 H = H + 40
170 IF H > 255 THEN H = H - 256
180 GOTO 20` },
  { name:'Комета FADE',       desc:'Комета через буфер кадра',
    code:`10 H = 0
20 P = 0
100 FOR I = 0 TO PIXEL
110   FADE I , 35
120 NEXT I
130 SET_HSV P , H , 255 , 255
140 WAIT 30
150 P = P + 1
160 IF P <= PIXEL THEN GOTO 100
170 H = H + 40
180 IF H > 255 THEN H = (H - 256)
190 CLEAR
200 WAIT 300
210 P = 0
220 GOTO 100` },
  { name:'Маятник (Scan)',    desc:'Один пиксель туда-обратно',
    code:`10 H = 0
' движение вперёд: 0 → PIXEL
20 FOR I = 0 TO PIXEL
30   IF I > 0 THEN SET I - 1 , 0 , 0 , 0
40   SET_HSV I , H , 255 , 255
50   WAIT 35
60 NEXT I
' движение назад: PIXEL → 0
70 FOR I = PIXEL TO 0 STEP -1
80   IF I < PIXEL THEN SET I + 1 , 0 , 0 , 0
90   SET_HSV I , H , 255 , 255
100  WAIT 35
110 NEXT I
120 H = H + 30
130 IF H > 255 THEN H = H - 256
140 GOTO 20` },
  { name:'Бегущий паттерн',   desc:'Theater Chase — каждый третий светится',
    code:`10 H = 0
11 Z = 0
20 FOR I = 0 TO PIXEL
30   R = I + Z
40   R = R % 3
50   IF R == 0 THEN SET_HSV I , H , 255 , 200
60   IF R != 0 THEN SET I , 0 , 0 , 0
70 NEXT I
80 WAIT 80
90 Z = Z + 1
100 IF Z > 2 THEN Z = 0
110 IF Z == 0 THEN H = H + 20
120 IF H > 255 THEN H = H - 256
130 GOTO 20` },
  { cat:'Эффекты' },
  { name:'Огонь',             desc:'Языки пламени через шум',
    code:`10 T = 0
20 FOR I = 0 TO PIXEL
30   X = I * 25
40   N = NOISE X , T
50   U = X * 4
60   N = N * 3 + NOISE U , T * 3
70   N = N / 4
80   H = MAP N , 0 , 255 , 0 , 30
90   N = CONSTRAIN N , 0 , 255
100  V = EXP8 N
110  SET_HSV I , H , 255 , V
120 NEXT I
130 WAIT 25
140 T = T + 5
150 IF T > 32000 THEN T = 0
160 GOTO 20` },
  { name:'Океан',             desc:'Волны с гребнями',
    code:`10 T = 0
20 FOR I = 0 TO PIXEL
30   X = I * 30
40   S = NOISE X , T
50   W = NOISE (X * 3) , (T * 4)
60   V = (S / 2) + (W / 2)
70   H = 140 + S / 8
80   SET_HSV I , H , 255 , V
90   IF V > 220 THEN SET I , 200 , 230 , 255
100 NEXT I
110 WAIT 25
120 T = T + 3
130 IF T > 32000 THEN T = 0
140 GOTO 20` },
  { name:'Лава',              desc:'Minecraft Lava — три октавы шума',
    code:`10 T = 0
20 FOR I = 0 TO PIXEL
30   X = I * 25
40   N = NOISE X , T
50   B = NOISE (X * 3) , (T * 2)
60   C = NOISE (X * 5) , (T * 3)
70   V = ((N * 4) + (B * 2) + C) / 7
80   IF V >= 80 THEN GOTO 120
90   SET I , (V * 2) , 0 , 0
100  GOTO 180
120  IF V >= 160 THEN GOTO 140
130  SET I , 255 , ((V * 2) - 160) , 0
131  GOTO 180
140  IF V >= 220 THEN GOTO 160
150  SET I , 255 , (V + (V / 2) - 80) , 0
151  GOTO 180
160  SET I , 255 , 220 , ((V - 220) * 4)
180 NEXT I
190 WAIT 30
200 T = T + 4
210 IF T > 32000 THEN T = 0
220 GOTO 20` },
  { name:'Северное сияние',   desc:'Aurora — NOISE + MAP + EXP8',
    code:`10 T = 0
20 FOR I = 0 TO PIXEL
30   X = I * 22
40   N = NOISE X , T
50   H = MAP N , 0 , 255 , 85 , 200
60   V = EXP8 N
70   S = MAP V , 0 , 255 , 120 , 255
80   SET_HSV I , H , S , V
90 NEXT I
100 WAIT 30
110 T = T + 2
120 IF T > 32000 THEN T = 0
130 GOTO 20` },
  { cat:'Матрица 16×16' },
  { name:'Плазма 16×16',      desc:'Три SIN8-волны на матрице',
    code:`10 T = 0
20 FOR I = 0 TO 255
30   R = I / 16
40   C = I % 16
50   Z = R % 2
60   IF Z == 1 THEN C = 15 - C
70   X = C * 16
80   Y = R * 16
90   A = (X + T) % 256
100  H = SIN8 A
110  B = (Y + 256 - T) % 256
120  S = COS8 B
130  H = H + S
140  C = (X + Y + T) % 256
150  S = SIN8 C
160  H = H + S
170  H = H / 3
180  SET_HSV I , H , 255 , 255
190 NEXT I
200 WAIT 25
210 T = T + 3
220 IF T > 255 THEN T = (T - 256)
230 GOTO 20` },
  { name:'Лава 16×16',       desc:'Эффект лавы',
    code:`10 T = 0
20 FOR I = 0 TO PIXEL
30   X = I * 25
40   N = NOISE X , T
50   U = X * 3
60   B = NOISE U , T * 2
70   U = X * 5
80   C = NOISE U , T * 3
90   V = N * 4 + B * 2 + C
100  V = V / 7
110  IF V >= 80 THEN GOTO 150
120  R = V * 2
130  SET I , R , 0 , 0
140  GOTO 210
150  IF V >= 160 THEN GOTO 170
160  G = V * 2 - 160
161  SET I , 255 , G , 0
162  GOTO 210
170  IF V >= 220 THEN GOTO 190
180  G = V + V / 2 - 80
181  SET I , 255 , G , 0
182  GOTO 210
190  G = 220
200  B = V - 220
201  B = B * 4
202  SET I , 255 , G , B
210 NEXT I
220 WAIT 30
230 T = T + 4
240 IF T > 32000 THEN T = 0
250 GOTO 20` },
];

function buildExamplesMenu(){
  const menu=document.getElementById('dd-examples-menu');
  menu.innerHTML='';
  EXAMPLES.forEach(ex=>{
    if(ex.cat){
      const d=document.createElement('div');
      d.className='ddcat'; d.textContent=ex.cat;
      menu.appendChild(d);
    } else {
      const d=document.createElement('div');
      d.className='dditem';
      d.innerHTML=`<span class="dditem-name">${ex.name}</span><span class="dditem-desc">${ex.desc}</span>`;
      d.onclick=()=>loadExample(ex);
      menu.appendChild(d);
    }
  });
}

function toggleExamples(e){
  e.stopPropagation();
  const menu=document.getElementById('dd-examples-menu');
  const isOpen=menu.classList.contains('open');
  closeAllDropdowns();
  if(!isOpen) menu.classList.add('open');
}
function closeAllDropdowns(){
  document.querySelectorAll('.ddmenu').forEach(m=>m.classList.remove('open'));
}
document.addEventListener('click', closeAllDropdowns);

function loadExample(ex){
  closeAllDropdowns();
  if(code && code.trim()){
    const go=()=>{ code=ex.code; ta.value=code; onInput(); setDirty(true);
      document.getElementById('tabname').value=ex.name.replace(/\s+/g,'_').toLowerCase()+'.bas';
    };
    showConfirm('Загрузить пример?',`Текущий код будет заменён на «${ex.name}».`,go);
  } else {
    code=ex.code; ta.value=code; onInput(); setDirty(true);
    document.getElementById('tabname').value=ex.name.replace(/\s+/g,'_').toLowerCase()+'.bas';
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  СПРАВОЧНИК
// ══════════════════════════════════════════════════════════════════════════════

function showReference(){
  const tabsEl=document.getElementById('ref-tabs');
  const bodyEl=document.getElementById('ref-body');
  if(!tabsEl.hasChildNodes()){
    REFERENCE.forEach((pg,i)=>{
      const t=document.createElement('div');
      t.className='ref-tab'+(i===0?' on':'');
      t.textContent=pg.label;
      t.onclick=()=>switchRefTab(i);
      tabsEl.appendChild(t);
      const p=document.createElement('div');
      p.className='ref-page'+(i===0?' on':'');
      p.innerHTML=pg.html;
      bodyEl.appendChild(p);
    });
  }
  showModal('m-ref');
}

function switchRefTab(idx){
  document.querySelectorAll('.ref-tab').forEach((t,i)=>t.classList.toggle('on',i===idx));
  document.querySelectorAll('.ref-page').forEach((p,i)=>p.classList.toggle('on',i===idx));
}

// Init examples menu on load
document.addEventListener('DOMContentLoaded',buildExamplesMenu);

function showSettings(){
  document.getElementById('cfg-fs').value=cfg.fs||13;
  document.getElementById('cfg-tab').value=cfg.tab;
  document.getElementById('cfg-ac').checked=cfg.ac;
  document.getElementById('cfg-ns').value=cfg.ns;
  document.getElementById('cfg-nst').value=cfg.nst;
  document.getElementById('cfg-spd').value=cfg.speed;
  document.getElementById('cfg-br').value=cfg.brightness;
  showModal('m-set');
}

function applySettings(){
  cfg.fs=+document.getElementById('cfg-fs').value||12.5;
  cfg.tab=+document.getElementById('cfg-tab').value||2;
  cfg.ac=document.getElementById('cfg-ac').checked;
  cfg.ns=+document.getElementById('cfg-ns').value||10;
  cfg.nst=+document.getElementById('cfg-nst').value||10;
  cfg.speed=+document.getElementById('cfg-spd').value||100;
  cfg.brightness=+document.getElementById('cfg-br').value||255;

  const lh=cfg.fs*1.6;
  const fss=cfg.fs+'px';
  const lhs=lh+'px';
  document.documentElement.style.setProperty('--FS',fss);
  document.documentElement.style.setProperty('--LH',lhs);
  ta.style.fontSize=fss; ta.style.lineHeight=lhs;
  hlayer.style.fontSize=fss; hlayer.style.lineHeight=lhs;
  document.querySelectorAll('.gln').forEach(el=>{el.style.height=lhs;el.style.lineHeight=lhs;});
  if(vm) vm.setSpeed(cfg.speed);
  document.getElementById('st-spd').textContent='×'+(cfg.speed/100).toFixed(1);
  syncSize(); updateHL(); updateGutter(); drawEmu();
  hideModal(); notify('Настройки применены','ok');
}

// ═══════════════════ MODAL / NOTIFY ═══════════════════
function showModal(id){
  // Hide all modals with display:none
  document.querySelectorAll('.modal').forEach(m=>{
    m.style.display='none';
  });
  // Show target — reference needs flex, others need block
  const el=document.getElementById(id);
  if(el) el.style.display=(id==='m-ref')?'flex':'block';
  document.getElementById('ov').classList.add('vis');
}
function hideModal(){
  document.getElementById('ov').classList.remove('vis');
  document.querySelectorAll('.modal').forEach(m=>m.style.display='none');
}

let notifTimer=null;
function notify(msg,t=''){
  const el=document.getElementById('notif');
  el.textContent=msg; el.className='vis '+(t==='ok'?'ok':t==='err'?'err':'');
  clearTimeout(notifTimer); notifTimer=setTimeout(()=>el.className='',2500);
}

// ═══════════════════ RESIZE PANELS ═══════════════════
const rh = document.getElementById('rh');
const rv = document.getElementById('rv');
const sb = document.getElementById('sb');
const bot = document.getElementById('bot');

let dragDir = null, startPos = 0, startSize = 0;

// Горизонтальный ресайз (низ)
rh.addEventListener('mousedown', e => {
  dragDir = 'v'; startPos = e.clientY; startSize = bot.offsetHeight;
  document.body.style.cssText = 'cursor:ns-resize;user-select:none';
  rh.classList.add('drag');
});

// Вертикальный ресайз (левая панель)
rv.addEventListener('mousedown', e => {
  dragDir = 'h'; startPos = e.clientX; startSize = sb.offsetWidth;
  document.body.style.cssText = 'cursor:ew-resize;user-select:none';
  rv.classList.add('drag');
});

document.addEventListener('mousemove', e => {
  if (!dragDir) return;
  if (dragDir === 'v') {
    const h = Math.max(60, Math.min(500, startSize + (startPos - e.clientY)));
    bot.style.height = h + 'px';
  } else if (dragDir === 'h') {
    // Ограничиваем ширину эмулятора (от 180px до половины экрана)
    const w = Math.max(180, Math.min(window.innerWidth / 2, startSize + (e.clientX - startPos)));
    sb.style.width = w + 'px';
    syncSize(); // Синхронизируем размер текста в редакторе
  }
});

document.addEventListener('mouseup', () => {
  if (dragDir) {
    dragDir = null;
    document.body.style.cssText = '';
    rh.classList.remove('drag');
    rv.classList.remove('drag');
  }
});

// ═══════════════════ INIT ═══════════════════
const DEMO=`' LedBasic IDE v3 — демо: радуга + искры
10 N = PIXEL
20 H = 0

100 P = 0
110 C = H + P * 8
120 SET_HSV P , C , 255 , 170
130 S = RND 0 , 14
140 IF S == 0 THEN SET P , 255 , 255 , 220
150 P = P + 1
160 IF P <= N THEN GOTO 110
170 WAIT 25
180 H = H + 4
190 IF H > 255 THEN H = H - 256
200 GOTO 100`;

ta.value=DEMO;
code=DEMO;
resizeEmu();
onInput();
// Явно скрываем все панели нижней зоны до вызова showBot
['con','byv','varv'].forEach(id=>{
  const el=document.getElementById(id);
  if(el) el.style.display='none';
});
showBot('con');
lg('LedBasic IDE v3','o');
lg('Ctrl+Enter — Запуск  |  Ctrl+S — Сохранить  |  F5 — Запуск','i');
