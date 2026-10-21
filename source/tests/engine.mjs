import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newGame,advance,makeDeck,currentScenario,summary} from '../lib/game/engine.mjs';
const d=JSON.parse(fs.readFileSync(new URL('../lib/game/data.json',import.meta.url),'utf8'));
let checks=0;const ok=(x,msg)=>{assert.ok(x,msg);checks++;};
ok(d.PRINCIPLES.length===13&&d.SYMPTOMS.length===18&&d.CARDS.length===11,'Original content counts preserved');
for(let i=0;i<100;i++){const a=makeDeck(d,13,'seed'+i);ok(new Set(a).size===13,'No duplicate case');ok(new Set(a.map(ref=>d.SYMPTOMS.find(x=>x.ref===ref).answer[0])).size===13,'All principles covered');ok(JSON.stringify(a)===JSON.stringify(makeDeck(d,13,'seed'+i)),'Deterministic team order');}
for(const count of [8,13,18]){let s=newGame(d,'diagnostic',{count},'Test',100);while(s.phase!=='done'){const c=d.SYMPTOMS.find(x=>x.ref===s.deck[s.index]);s=advance(d,s,{type:'answer',choice:c.answer[0]},200);assert.throws(()=>advance(d,s,{type:'answer',choice:c.answer[0]}));s=advance(d,s,{type:'next'},300);}ok(s.score===count*2,'Perfect diagnostic score');ok(summary(d,s).done,'Completed state');}
let s=newGame(d,'diagnostic',{count:18},'Hints',100);s=advance(d,s,{type:'hint'},200);const symptom=d.SYMPTOMS.find(x=>x.ref===s.deck[0]);ok(s.disabled.length===7&&!s.disabled.some(id=>symptom.answer.includes(id)),'Hint removes seven wrong choices');assert.throws(()=>advance(d,s,{type:'hint'}));s=advance(d,s,{type:'answer',choice:symptom.answer[0]},300);ok(s.score===1&&s.lifelines===1,'Hint reduces score exactly once');
for(const answer of ['speediness','accountability']){let s=newGame(d,'diagnostic',{count:18},'Ambiguous');s.deck=['B-22'];s=advance(d,s,{type:'answer',choice:answer});ok(s.score===2,'Both defensible diagnoses accepted');}
let outcomes=0;
for(const sc of d.SCENARIOS){ok(sc.stages.length===5,'Five stages');for(let i=0;i<5;i++){for(const c of d.CARDS){let s=newGame(d,'escalation',{scenario:sc.id,startStage:0},'Outcomes',100);s.stage=i;s=advance(d,s,{type:'play',choice:c.id},200);const outcome=sc.stages[i].outcomes[c.id];ok(outcome?.msg.length>30,'Outcome explained');ok(s.feedback.kind===outcome.kind&&s.used.includes(c.id),'Correct outcome and card consumption');assert.throws(()=>advance(d,s,{type:'play',choice:c.id}));if(c.id==='c11')ok(s.feedback.kind==='escalate','Trap always advances');const n=advance(d,s,{type:'next'},300);if(outcome.kind==='hold'){ok(n.stage===i&&n.held===1,'Hold keeps stage and adds cost');assert.throws(()=>advance(d,n,{type:'play',choice:c.id}));}outcomes++;}}}
ok(outcomes===165,'All scenario/card combinations checked');
let campaign=newGame(d,'escalation',{scenario:'all',startStage:2},'Campaign',100);
while(campaign.phase!=='done'){const sc=currentScenario(d,campaign),id=Object.keys(sc.stages[campaign.stage].outcomes).find(id=>sc.stages[campaign.stage].outcomes[id].kind==='resolve');campaign=advance(d,campaign,{type:'play',choice:id},200);campaign=advance(d,campaign,{type:'next'},300);}
ok(campaign.scenarioResults.length===3&&campaign.scenarioResults.every(r=>r.stage===2),'Campaign resets to selected start stage');ok(summary(d,campaign).resolved===3,'Three disputes resolved');
let losing=newGame(d,'escalation',{scenario:'dismissal'},'Late');losing.stage=4;losing=advance(d,losing,{type:'play',choice:'c11'});ok(losing.feedback.cost===200,'Last-stage failure shows 200 immediately');losing=advance(d,losing,{type:'next'});ok(summary(d,losing).cost===200&&losing.phase==='done','Failure report consistent');
console.log(`${checks} assertions passed; all 165 intervention outcomes validated.`);
