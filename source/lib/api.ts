import DATA from './game/data.json';
import { advance, newGame, settingsFor, summary } from './game/engine.mjs';
const ALLOWED=new Set(['https://darrindookie-itcilo.github.io','https://labour-dispute-games.darrin-dookie.chatgpt.site','http://terminal.local:4173']);
const enc=new TextEncoder();
const hex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const random=(n=32)=>hex(crypto.getRandomValues(new Uint8Array(n)));
const digest=async(s:string)=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))));
class HttpError extends Error {constructor(public status:number,message:string){super(message);}}
const bad=(status:number,msg:string):never=>{throw new HttpError(status,msg);};
const safeCode=(s:string)=>/^[A-Z2-9]{8}$/.test(s)?s:bad(404,'Session not found. Check the eight-character code.');
function roomJSON(r:any){return {code:r.code,name:r.name,game:r.game,settings:JSON.parse(r.settings),status:r.status,createdAt:r.created_at,deadline:r.deadline,remaining:r.remaining};}
function teamJSON(t:any){const state=JSON.parse(t.state);return {id:t.id,name:t.name,revision:t.revision,updatedAt:t.updated_at,state,summary:summary(DATA,state)};}
async function passwordMatches(password:string,stored:string){
 const [iterations,salt,want]=String(stored).split(':');if(!salt||!want||Number(iterations)!==100000)return false;
 const material=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 const result=hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:100000,salt:Uint8Array.from(salt.match(/../g)!.map(x=>parseInt(x,16)))},material,256)));
 let diff=result.length^want.length;for(let i=0;i<result.length;i++)diff|=result.charCodeAt(i)^want.charCodeAt(i);return diff===0;
}
export async function handle(request:Request,env:any){
 const origin=request.headers.get('Origin'),headers:any={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
 if(origin&&ALLOWED.has(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Headers']='Content-Type, Authorization';headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';}
 const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers});
 try{
  if(origin&&!ALLOWED.has(origin))bad(403,'This origin is not allowed.');
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  const path=new URL(request.url).pathname.replace(/\/$/,''),method=request.method;
  if(path==='/api/health')return json({ok:true,version:'2.0',games:2});
  if(!env.DB)bad(503,'The results service is not ready. Practice mode is available.');
  const db=env.DB;
  let body:any={};
  if(method==='POST'){
    if(!request.headers.get('Content-Type')?.includes('application/json'))bad(415,'Use JSON.');
    const raw=await request.text();if(raw.length>5000)bad(413,'This request is too large.');
    try{body=JSON.parse(raw);}catch{bad(400,'Invalid request.');}
    if(!body||typeof body!=='object'||Array.isArray(body))bad(400,'Invalid request.');
  }
  const bearer=request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1]||'';
  const tokenHash=bearer?await digest(bearer):'';
  const requireAdmin=async()=>{if(!tokenHash||!await db.prepare('SELECT token_hash FROM sessions WHERE token_hash=? AND expires>?').bind(tokenHash,Date.now()).first())bad(401,'Please sign in to the facilitator view.');};
  const getRoom=async(code:string)=>{const r=await db.prepare('SELECT * FROM rooms WHERE code=?').bind(safeCode(code)).first();if(!r)bad(404,'Session not found. Check the eight-character code.');return r;};
  if(path==='/api/login'&&method==='POST'){
    if(!env.FACILITATOR_EMAIL||!env.FACILITATOR_PASSWORD_HASH)bad(503,'Facilitator sign-in is not configured.');
    const ip=request.headers.get('CF-Connecting-IP')||'unknown',key=await digest('login:'+ip),now=Date.now();
    await db.prepare('INSERT INTO login_limits(key,count,reset_at) VALUES(?,0,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at<? THEN 0 ELSE count END, reset_at=CASE WHEN reset_at<? THEN ? ELSE reset_at END').bind(key,now+900000,now,now,now+900000).run();
    const limit=await db.prepare('SELECT * FROM login_limits WHERE key=?').bind(key).first();if(limit.count>=5)bad(429,'Too many attempts. Try again in 15 minutes.');
    await db.prepare('UPDATE login_limits SET count=count+1 WHERE key=?').bind(key).run();
    const email=String(body.email||'').trim().toLowerCase(),password=String(body.password||'');
    if(password.length>128||!await passwordMatches(password,env.FACILITATOR_PASSWORD_HASH)||email!==String(env.FACILITATOR_EMAIL).trim().toLowerCase())bad(401,'The username or password is incorrect.');
    await db.prepare('UPDATE login_limits SET count=0 WHERE key=?').bind(key).run();
    const token=random();await db.batch([db.prepare('DELETE FROM sessions WHERE expires<?').bind(now),db.prepare('INSERT INTO sessions(token_hash,expires) VALUES(?,?)').bind(await digest(token),now+12*3600000)]);
    return json({token,expiresAt:now+12*3600000});
  }
  if(path==='/api/logout'&&method==='POST'){await requireAdmin();await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(tokenHash).run();return json({ok:true});}
  if(path==='/api/me'){await requireAdmin();return json({ok:true});}
  if(path==='/api/rooms'){
    await requireAdmin();
    if(method==='GET'){
     const rows=await db.prepare('SELECT r.*, (SELECT COUNT(*) FROM teams t WHERE t.room=r.code) AS team_count FROM rooms r ORDER BY created_at DESC LIMIT 100').all();return json({rooms:rows.results.map((r:any)=>({...roomJSON(r),teamCount:r.team_count}))});
    }
    if(method==='POST'){
      let settings;try{settings=settingsFor(body.game,body.settings);}catch{bad(400,'Choose a valid game.');}
      const code=Array.from(crypto.getRandomValues(new Uint8Array(8)),b=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b%32]).join(''),now=Date.now(),name=String(body.name||'Workshop session').trim().slice(0,80)||'Workshop session';
      await db.prepare('INSERT INTO rooms(code,name,game,settings,status,created_at,deadline,remaining) VALUES(?,?,?,?,?,?,?,?)').bind(code,name,body.game,JSON.stringify(settings),'open',now,now+settings.minutes*60000,settings.minutes*60000).run();return json({room:roomJSON(await getRoom(code))},201);
    }
  }
  const publicMatch=path.match(/^\/api\/public-room\/([A-Z2-9]{8})$/);
  if(publicMatch&&method==='GET'){return json({room:roomJSON(await getRoom(publicMatch[1]))});}
  const boardMatch=path.match(/^\/api\/scoreboard\/([A-Z2-9]{8})$/);
  if(boardMatch&&method==='GET'){
   const room=await getRoom(boardMatch[1]),rows=await db.prepare('SELECT * FROM teams WHERE room=? ORDER BY updated_at DESC LIMIT 100').bind(room.code).all();return json({room:roomJSON(room),teams:rows.results.map((t:any)=>({name:t.name,...summary(DATA,JSON.parse(t.state))}))});
  }
  if(path==='/api/join'&&method==='POST'){
   const room=await getRoom(String(body.code||'').trim().toUpperCase());if(room.status==='closed')bad(409,'This session is closed. Ask the facilitator for a new code.');
   const name=String(body.name||'').trim().slice(0,40);if(!name)bad(400,'Enter a team name.');
   const nameExists=await db.prepare('SELECT id FROM teams WHERE room=? AND lower(name)=lower(?)').bind(room.code,name).first();if(nameExists)bad(409,'That team name is already in use. Resume on the original device or choose a different name.');
   const count=await db.prepare('SELECT COUNT(*) AS n FROM teams WHERE room=?').bind(room.code).first();if(count.n>=100)bad(409,'This session is full.');
   const token=random(),id=crypto.randomUUID(),now=Date.now(),state=newGame(DATA,room.game,JSON.parse(room.settings),name,now);
   await db.prepare('INSERT INTO teams(id,room,name,token_hash,state,revision,updated_at) VALUES(?,?,?,?,?,0,?)').bind(id,room.code,name,await digest(token),JSON.stringify(state),now).run();
   return json({token,room:roomJSON(room),team:{id,name,revision:0,updatedAt:now,state,summary:summary(DATA,state)}},201);
  }
  if(path==='/api/team'||path==='/api/team/action'){
   const team=tokenHash?await db.prepare('SELECT * FROM teams WHERE token_hash=?').bind(tokenHash).first():null;if(!team)bad(401,'This team connection has expired. Rejoin with the session code.');
   const room=await getRoom(team.room);
   if(path==='/api/team'&&method==='GET')return json({room:roomJSON(room),team:teamJSON(team)});
   if(path==='/api/team/action'&&method==='POST'){
    const old=JSON.parse(team.state),requestId=String(body.requestId||'');
    if(!/^[a-zA-Z0-9-]{10,60}$/.test(requestId))bad(400,'A request identifier is required.');
    if(old.requestIds.includes(requestId))return json({room:roomJSON(room),team:teamJSON(team)});
    if(room.status!=='open'&&body.action?.type!=='reflection')bad(409,room.status==='paused'?'The facilitator has paused this session.':'This session is closed. You can still export your result.');
    if(Number(body.revision)!==team.revision)return json({error:'Progress changed on another tab. The current state has been restored.',room:roomJSON(room),team:teamJSON(team)},409);
    let state;try{state=advance(DATA,old,body.action||{});}catch(e:any){bad(400,e.message||'That move is not available.');}
    state.requestIds=[...state.requestIds.slice(-19),requestId];const now=Date.now();
    const updated=await db.prepare('UPDATE teams SET state=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(JSON.stringify(state),now,team.id,team.revision).run();
    const current=await db.prepare('SELECT * FROM teams WHERE id=?').bind(team.id).first();
    return json({...(updated.meta.changes?{}:{error:'Another tab updated this team. The current state has been restored.'}),room:roomJSON(room),team:teamJSON(current)},updated.meta.changes?200:409);
   }
  }
  const roomMatch=path.match(/^\/api\/room\/([A-Z2-9]{8})(?:\/(control|reset)(?:\/([a-zA-Z0-9-]+))?)?$/);
  if(roomMatch){
    await requireAdmin();const room=await getRoom(roomMatch[1]);
    if(method==='GET'&&!roomMatch[2]){
      const [ts,attempts]=await Promise.all([db.prepare('SELECT * FROM teams WHERE room=? ORDER BY updated_at DESC').bind(room.code).all(),db.prepare('SELECT * FROM attempts WHERE room=? ORDER BY saved_at DESC').bind(room.code).all()]);
      return json({room:roomJSON(room),teams:ts.results.map(teamJSON),attempts:attempts.results.map((a:any)=>({id:a.id,teamId:a.team,savedAt:a.saved_at,state:JSON.parse(a.state)}))});
    }
    if(method==='POST'&&roomMatch[2]==='control'){
     const now=Date.now(),action=body.action;
     if(action==='pause'&&room.status==='open')await db.prepare('UPDATE rooms SET status=?,remaining=?,deadline=NULL WHERE code=?').bind('paused',Math.max(0,room.deadline-now),room.code).run();
     else if(action==='resume'&&room.status==='paused')await db.prepare('UPDATE rooms SET status=?,deadline=? WHERE code=?').bind('open',now+room.remaining,room.code).run();
     else if(action==='close')await db.prepare('UPDATE rooms SET status=?,remaining=?,deadline=NULL WHERE code=?').bind('closed',Math.max(0,room.deadline?room.deadline-now:room.remaining),room.code).run();
     else if(action==='extend'&&room.status!=='closed')await db.prepare('UPDATE rooms SET deadline=CASE WHEN deadline IS NULL THEN NULL ELSE deadline+30000 END,remaining=remaining+30000 WHERE code=?').bind(room.code).run();
     else bad(400,'That session control is not available.');
     return json({room:roomJSON(await getRoom(room.code))});
    }
    if(method==='POST'&&roomMatch[2]==='reset'&&roomMatch[3]){
      const t=await db.prepare('SELECT * FROM teams WHERE id=? AND room=?').bind(roomMatch[3],room.code).first();if(!t)bad(404,'Team not found.');
      const now=Date.now(),state=newGame(DATA,room.game,JSON.parse(room.settings),t.name,now);
      await db.batch([db.prepare('INSERT INTO attempts(id,team,room,state,saved_at) SELECT ?,id,room,state,? FROM teams WHERE id=? AND revision=?').bind(crypto.randomUUID(),now,t.id,t.revision),db.prepare('UPDATE teams SET state=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(JSON.stringify(state),now,t.id,t.revision)]);
      return json({ok:true});
    }
  }
  bad(404,'This endpoint does not exist.');
 }catch(e:any){return json({error:e instanceof HttpError?e.message:'The results service could not complete that request. Please try again.'},e instanceof HttpError?e.status:500);}
}
