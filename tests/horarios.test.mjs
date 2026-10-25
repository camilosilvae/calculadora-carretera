import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const rules=JSON.parse(await readFile(new URL("../data/horarios-porticos-2026.json",import.meta.url),"utf8"));

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

console.log("OK: reglas horarias críticas 2026");
