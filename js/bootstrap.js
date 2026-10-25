(function(){
"use strict";

var scriptUrl=(document.currentScript&&document.currentScript.src)||
  new URL("js/bootstrap.js",window.location.href).href;

function asset(path){
  return new URL(path,scriptUrl).href;
}
async function cargarJson(path){
  var r=await fetch(asset(path),{cache:"no-store"});
  if(!r.ok) throw new Error(path+" respondió "+r.status);
  return r.json();
}
function cargarScript(path){
  return new Promise(function(resolve,reject){
    var s=document.createElement("script");
    s.src=asset(path);
    s.onload=resolve;
    s.onerror=function(){reject(new Error("No se pudo cargar "+path));};
    document.head.appendChild(s);
  });
}
function mostrarError(err){
  console.error(err);
  var box=document.createElement("div");
  box.setAttribute("role","alert");
  box.style.cssText="position:fixed;inset:auto 20px 20px 20px;z-index:99999;background:#171614;color:#fff;padding:16px 18px;border-left:4px solid #d14b35;font:14px/1.5 system-ui,sans-serif";
  box.textContent="No se pudieron cargar los datos de la aplicación: "+err.message;
  document.body.appendChild(box);
}

Promise.all([
  cargarJson("../data/catalogo-geografico-2026.json"),
  cargarJson("../data/tarifas-2026.json"),
  cargarJson("../data/horarios-porticos-2026.json")
]).then(function(datos){
  window.CATALOGO_GEOGRAFICO_INCLUIDO=datos[0];
  window.PAQUETE_TARIFARIO_INCLUIDO=datos[1];
  window.HORARIOS_PORTICOS_2026=datos[2];
  return cargarScript("./app.js");
}).catch(mostrarError);
})();
