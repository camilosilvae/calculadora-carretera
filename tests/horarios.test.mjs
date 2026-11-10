import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const rules=JSON.parse(await readFile(new URL("../data/horarios-porticos-2026.json",import.meta.url),"utf8"));
const geo=JSON.parse(await readFile(new URL("../data/catalogo-geografico-2026.json",import.meta.url),"utf8"));
const tarifas=JSON.parse(await readFile(new URL("../data/tarifas-2026.json",import.meta.url),"utf8"));

function inRange(min,[a,b]){
  if(b===0&&a>0) b=1440;
  return a<b ? min>=a&&min<b : min>=a||min<b;
}
function band(key,day,min){
  const rule=rules[key];
  assert.ok(rule,"Falta regla "+key);
  const bands=rule[day]||{};
  if((bands.TS||[]).some(r=>inRange(min,r))) return "TS";
  if((bands.TBP||[]).some(r=>inRange(min,r))) return "TBP";
  return "TBFP";
}
const m=(h,min)=>h*60+min;

// Casos críticos que deben permanecer estables.
assert.equal(band("route_autopista_central|PA26|Norte - Sur","laboral",m(19,32)),"TBP");
assert.equal(band("route_autopista_central|PA26|Norte - Sur","sabado",m(19,32)),"TBFP");
assert.equal(band("route_autopista_vespucio_norte|P10|Poniente - Oriente","laboral",m(8,15)),"TS");
assert.equal(band("route_autopista_vespucio_norte|P10|Poniente - Oriente","laboral",m(10,0)),"TBFP");
assert.equal(band("route_costanera_norte|P0|Oriente - Poniente","laboral",m(7,45)),"TS");

// AVO I: pertenencia explícita por sentido, según tabla validada.
const avoRoute="route_americo_vespucio_oriente_avo_i";
const avoPoints=new Map(
  geo.points.filter(p=>p.route_id===avoRoute).map(p=>[p.code,p])
);
const senses=code=>avoPoints.get(code)?.avo_senses||[];
const norte=["P101","P102","P103","P104","P111","P105","P106","P107","P108","P109"];
const sur=["P201","P202","P203","P212","P204","P205","P107","P206","P103","P210","P209","P211"];
for(const code of norte)
  assert.ok(senses(code).includes("norte"),code+" debe pertenecer a sentido norte");
for(const code of sur)
  assert.ok(senses(code).includes("sur"),code+" debe pertenecer a sentido sur");
assert.deepEqual(senses("P103").slice().sort(),["norte","sur"]);
assert.deepEqual(senses("P107").slice().sort(),["norte","sur"]);

for(const j of tarifas.journey_fares.filter(j=>j.route_id===avoRoute&&j.origin_code!=="P110")){
  const a=senses(j.origin_code),b=senses(j.destination_code);
  assert.ok(a.length&&b.length,"Falta sentido explícito en "+j.origin_code+"→"+j.destination_code);
  assert.ok(a.some(s=>b.includes(s)),
    "Par AVO cruza sentidos incompatibles: "+j.origin_code+"→"+j.destination_code);
}

console.log("OK: reglas horarias críticas y sentidos AVO I 2026");
