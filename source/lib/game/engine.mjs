/* Pure deterministic rules, used by practice and by the server. */
export function rng(seed='workshop') {
  let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}
  return ()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
export function shuffled(a,random){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makeDeck(data,count,seed){
  const random=rng(seed), all=shuffled(data.SYMPTOMS,random);
  if(count===18)return all.map(x=>x.ref);
  const selected=[];
  for(const p of shuffled(data.PRINCIPLES,random)){
    const s=all.find(x=>x.answer[0]===p.id&&!selected.includes(x));if(s)selected.push(s);
  }
  return shuffled(selected,random).slice(0,count).map(x=>x.ref);
}
export function settingsFor(game,s={}){
  if(!['diagnostic','escalation'].includes(game))throw Error('Choose a valid game.');
  return {count:[8,13,18].includes(Number(s.count))?Number(s.count):13,seed:String(s.seed||'workshop').slice(0,40),scenario:['roster','dismissal','restructure','all'].includes(s.scenario)?s.scenario:'all',startStage:[0,2,4].includes(Number(s.startStage))?Number(s.startStage):0,minutes:Math.max(3,Math.min(60,Number(s.minutes)||15))};
}
export function newGame(data,game,settings,team,now=Date.now()){
 const s=settingsFor(game,settings);
 return {version:2,game,team:String(team).trim().slice(0,40)||'Team',settings:s,deck:game==='diagnostic'?makeDeck(data,s.count,s.seed):[],index:0,score:0,lifelines:2,hinted:false,disabled:[],phase:'question',log:[],streak:0,bestStreak:0,stage:s.startStage,scenarioIndex:0,scenarios:s.scenario==='all'?['roster','dismissal','restructure']:[s.scenario],used:[],held:0,scenarioResults:[],feedback:null,startedAt:now,updatedAt:now,endedAt:null,reflection:'',requestIds:[]};
}
export function currentScenario(data,s){return data.SCENARIOS.find(x=>x.id===s.scenarios[s.scenarioIndex]);}
export function costFor(data,s){return data.TIERS[s.stage].cost+s.held*2;}
export function advance(data,old,action,now=Date.now()){
 const s=JSON.parse(JSON.stringify(old));s.updatedAt=now;
 if(action.type==='reflection'){s.reflection=String(action.value||'').slice(0,1500);return s;}
 if(s.phase==='done')throw Error('This game is complete.');
 if(s.game==='diagnostic'){
  const card=data.SYMPTOMS.find(x=>x.ref===s.deck[s.index]);
  if(action.type==='hint'){
    if(s.phase!=='question'||s.hinted||s.lifelines<1)throw Error('No lifeline is available for this card.');
    s.hinted=true;s.lifelines--;s.disabled=shuffled(data.PRINCIPLES.filter(p=>!card.answer.includes(p.id)),rng(s.settings.seed+card.ref)).slice(0,7).map(p=>p.id);return s;
  }
  if(action.type==='answer'){
    if(s.phase!=='question'||s.disabled.includes(action.choice)||!data.PRINCIPLES.some(p=>p.id===action.choice))throw Error('Choose an available principle.');
    const right=card.answer.includes(action.choice),points=right?(s.hinted?1:2):0;
    s.score+=points;s.streak=right?s.streak+1:0;s.bestStreak=Math.max(s.streak,s.bestStreak);
    s.feedback={right,points,ref:card.ref,picked:action.choice};
    s.log.push({ref:card.ref,choice:action.choice,right,points,hint:s.hinted,confidence:action.confidence==='sure'?'sure':'discussing',reason:String(action.reason||'').slice(0,500),at:now});s.phase='feedback';
    if(s.index===s.deck.length-1)s.endedAt=now;
    return s;
  }
  if(action.type==='next'&&s.phase==='feedback'){
    if(s.index+1===s.deck.length){s.phase='done';s.endedAt=s.endedAt||now;return s;}
    s.index++;s.phase='question';s.feedback=null;s.hinted=false;s.disabled=[];return s;
  }
 }else{
  const sc=currentScenario(data,s);
  if(action.type==='play'){
    if(s.phase!=='question'||s.used.includes(action.choice)||!data.CARDS.some(c=>c.id===action.choice))throw Error('Choose a card you have not used in this dispute.');
    const outcome=sc.stages[s.stage].outcomes[action.choice];s.used.push(action.choice);
    if(outcome.kind==='hold')s.held++;
    const terminal=outcome.kind==='resolve'||(outcome.kind==='escalate'&&s.stage===4);
    const cost=outcome.kind==='resolve'?costFor(data,s):outcome.kind==='hold'?costFor(data,s):s.stage===4?200+s.held*2:data.TIERS[s.stage+1].cost+s.held*2;
    s.feedback={...outcome,card:action.choice,terminal,cost};
    s.log.push({scenario:sc.id,stage:s.stage,card:action.choice,kind:outcome.kind,msg:outcome.msg,cost,reason:String(action.reason||'').slice(0,500),at:now});s.phase='feedback';
    if(terminal){s.scenarioResults.push({scenario:sc.id,resolved:outcome.kind==='resolve',stage:s.stage,cost,plays:s.used.length});if(s.scenarioIndex+1===s.scenarios.length)s.endedAt=now;}
    return s;
  }
  if(action.type==='next'&&s.phase==='feedback'){
    if(s.feedback.terminal){
     if(s.scenarioIndex+1===s.scenarios.length){s.phase='done';s.endedAt=s.endedAt||now;return s;}
     s.scenarioIndex++;s.stage=s.settings.startStage;s.used=[];s.held=0;
    }else if(s.feedback.kind==='escalate')s.stage++;
    s.phase='question';s.feedback=null;return s;
  }
 }
 throw Error('That action is not available now.');
}
export function summary(data,s){
 const elapsed=Math.max(0,Math.floor(((s.endedAt||Date.now())-s.startedAt)/1000));
 if(s.game==='diagnostic')return {score:s.score,max:s.deck.length*2,progress:s.log.length,total:s.deck.length,done:s.phase==='done',elapsed,correct:s.log.filter(x=>x.right).length,wrong:s.log.filter(x=>!x.right).length,cost:0,resolved:0};
 const completed=s.scenarioResults.length,cost=s.scenarioResults.reduce((n,r)=>n+r.cost,0);
 return {score:0,max:0,progress:completed,total:s.scenarios.length,done:s.phase==='done',elapsed,correct:0,wrong:0,cost,stage:s.stage+1,resolved:s.scenarioResults.filter(x=>x.resolved).length};
}
