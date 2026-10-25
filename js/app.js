(function(){
"use strict";

var ATAJOS=[
  {etiqueta:"Viña del Mar", texto:"Viña del Mar, Valparaíso"},
  {etiqueta:"Zapallar", texto:"Zapallar, Valparaíso"},
  {etiqueta:"Concón", texto:"Concón, Valparaíso"},
  {etiqueta:"Santiago centro", texto:"Plaza de Armas, Santiago"}
];

function esTemporadaAlta(f){
  var m=f.getMonth()+1, d=f.getDate();
  return (m===12&&d>=20)||m===1||m===2||(m===3&&d<=10);
}
var REGLAS={
  ninguna:function(){ return false; },
  r68:function(f,min,s){
    var dia=f.getDay(), alta=esTemporadaAlta(f);
    var en=function(a,b){ return min>=a&&min<b; };
    if(s==="poniente"){
      if(dia===5&&en(1080,1320)) return alta;
      if(dia===6&&en(600,780))   return alta;
      return false;
    }
    return dia===0&&en(1080,1320);
  },
  r60:function(f,min,s){
    if(s!=="oriente"||f.getDay()!==0) return false;
    return min>=1020 && min<(esTemporadaAlta(f)?1260:1140);
  },
  nororiente:function(f,min){
    var dia=tipoDiaTarifario(f),en=function(a,b){return min>=a&&min<b;};
    if(dia==="laboral") return en(420,540)||en(1140,1260);
    if(dia==="sabado") return en(480,600)||en(1020,1260);
    if(dia==="domingo") return en(480,600);
    return false;
  },
  r78:function(f,min,s){
    var dia=f.getDay(),alta=esTemporadaAlta(f),en=function(a,b){return min>=a&&min<b;};
    if(!alta) return false;
    if(s==="oriente") return dia===0&&en(1080,1320);
    if(s==="poniente") return (dia===5&&en(1080,1320))||(dia===6&&en(600,780));
    return false;
  }
};

var HORARIOS_PORTICOS_2026=window.HORARIOS_PORTICOS_2026||{};

/* ============================================================
   Utilidades
   ============================================================ */
function $(id){ return document.getElementById(id); }
function num(id){ var e=$(id); if(!e) return 0; var v=parseFloat(e.value); return isFinite(v)?v:0; }
function pesos(n){ return (n<0?"−":"")+"$"+Math.round(Math.abs(n)).toLocaleString("es-CL"); }
function coma(n,d){ return n.toFixed(d===undefined?1:d).replace(".",","); }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function clave(n){ return n.toLowerCase().replace(/\s+/g," ").trim(); }
function minutosDe(h){ var p=(h||"09:00").split(":"); return parseInt(p[0],10)*60+parseInt(p[1],10); }
function reloj(min){
  var m=((Math.round(min)%1440)+1440)%1440;
  return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
}
function hora24Valida(h){
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(h||""));
}
function fechaIsoValida(v){
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v||""));
}
function etiquetaFechaSalida(v){
  if(!fechaIsoValida(v)) return "Elegir día";
  var p=v.split("-"),f=new Date(Number(p[0]),Number(p[1])-1,Number(p[2]));
  var dias=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  return dias[f.getDay()]+" "+String(f.getDate()).padStart(2,"0")+"/"+
    String(f.getMonth()+1).padStart(2,"0");
}
function esFestivoNacional2026(fecha){
  if(!fecha||fecha.getFullYear()!==2026) return false;
  var clave=String(fecha.getMonth()+1).padStart(2,"0")+"-"+String(fecha.getDate()).padStart(2,"0");
  return [
    "01-01","04-03","04-04","05-01","05-21","06-21","06-29","07-16",
    "08-15","09-18","09-19","10-12","10-31","11-01","12-08","12-25"
  ].indexOf(clave)>=0;
}
function tipoDiaTarifario(fecha){
  if(esFestivoNacional2026(fecha)) return "festivo";
  var d=fecha.getDay();
  if(d===6) return "sabado";
  if(d===0) return "domingo";
  return "laboral";
}
function textoHorarioNormalizado(t){
  return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[–—]/g,"-").replace(/\s+/g," ").trim().toLowerCase();
}
function rangosHorario(texto){
  var txt=textoHorarioNormalizado(texto),out=[],m;
  var re=/(\d{1,2}):(\d{2})\s*(?:-|a)\s*(\d{1,2}):(\d{2})/g;
  while((m=re.exec(txt))){
    var a=Number(m[1])*60+Number(m[2]);
    var b=Number(m[3])*60+Number(m[4]);
    if(a>=0&&a<=1439&&b>=0&&b<=1440) out.push([a,b]);
  }
  return out;
}
function minutoEnRango(min,a,b){
  min=((Math.round(min)%1440)+1440)%1440;
  if(a===b) return true;
  if(b===0&&a>0) b=1440;
  return a<b ? min>=a&&min<b : (min>=a||min<b);
}

function normalizarDireccionClave(d){
  return String(d||"").replace(/[–—]/g,"-").replace(/\s*[-]\s*/g," - ").replace(/\s+/g," ").trim();
}
function claveHorarioPortico(filas,punto){
  if(punto&&punto.route_id&&punto.codigo){
    var dirP=normalizarDireccionClave(punto.direccion||"");
    if(dirP){
      var kp=punto.route_id+"|"+String(punto.codigo).replace(/^PA\s+/,"PA")+"|"+dirP;
      if(HORARIOS_PORTICOS_2026[kp]) return kp;
    }
  }
  var f=(filas||[]).find(function(x){
    return x&&x.route_id&&x.point_code&&x.direction;
  });
  if(!f) return null;
  var k=f.route_id+"|"+String(f.point_code).replace(/^PA\s+/,"PA")+"|"+
    normalizarDireccionClave(f.direction);
  return HORARIOS_PORTICOS_2026[k]?k:null;
}
function detalleReglaHorario(regla,dia,tipo,min){
  var bandas=(regla&&regla[dia])||{};
  var rangos=bandas[tipo]||[];
  for(var i=0;i<rangos.length;i++){
    if(minutoEnRango(min,rangos[i][0],rangos[i][1])){
      return reloj(rangos[i][0])+"–"+reloj(rangos[i][1]);
    }
  }
  return tipo==="TBFP"?"fuera de TBP/TS":"";
}
function tipoTarifaPorHorarioPortico(filas,fecha,min,punto){
  var clave=claveHorarioPortico(filas,punto);
  if(!clave) return null;
  var regla=HORARIOS_PORTICOS_2026[clave];
  var dia=tipoDiaTarifario(fecha);
  var bandas=regla[dia]||{};
  function coincide(tipo){
    return (bandas[tipo]||[]).some(function(r){
      return minutoEnRango(min,r[0],r[1]);
    });
  }
  var tipo=coincide("TS")?"TS":(coincide("TBP")?"TBP":"TBFP");
  return {
    tipo:tipo,
    clave:clave,
    dia:dia,
    detalle:detalleReglaHorario(regla,dia,tipo,min)
  };
}
function segmentoAplicaDia(segmento,fecha){
  var t=textoHorarioNormalizado(segmento),dia=tipoDiaTarifario(fecha);
  var tieneEtiqueta=/(l-v|lunes|viernes|laboral|sabado|domingo|festivo)/.test(t);
  if(!tieneEtiqueta) return null;
  if(/domingo\s*\/\s*festivo|domingo\s+y\s+festivo/.test(t))
    return dia==="domingo"||dia==="festivo";
  if(/sabado\s+y\s+festivo|sabado\s*\/\s*festivo/.test(t))
    return dia==="sabado"||dia==="festivo";
  if(/l-v|lunes\s+a\s+viernes|laboral/.test(t)) return dia==="laboral";
  if(/sabado/.test(t)) return dia==="sabado";
  if(/domingo/.test(t)) return dia==="domingo";
  if(/festivo/.test(t)) return dia==="festivo";
  return false;
}
function horarioEtiquetadoCoincide(texto,fecha,min){
  if(!texto) return null;
  var normal=textoHorarioNormalizado(texto);
  if(/fuera de horario|fuera de los horarios|resto de horario/.test(normal)) return false;
  var segmentos=String(texto).split(/;/);
  var vioRegla=false;
  for(var i=0;i<segmentos.length;i++){
    var aplica=segmentoAplicaDia(segmentos[i],fecha);
    if(aplica===null) continue;
    vioRegla=true;
    if(!aplica) continue;
    var rr=rangosHorario(segmentos[i]);
    for(var j=0;j<rr.length;j++){
      if(minutoEnRango(min,rr[j][0],rr[j][1])) return true;
    }
  }
  return vioRegla?false:null;
}
function avisar(m,e){ var a=$("aviso"); a.textContent=m||""; a.className="aviso"+(e?" error":""); }
function estado(m){ $("estado").textContent=m||""; }
function haversine(a,b){
  var R=6371000, r=Math.PI/180;
  var dLat=(b[0]-a[0])*r, dLon=(b[1]-a[1])*r;
  var x=Math.sin(dLat/2)*Math.sin(dLat/2)+
        Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return 2*R*Math.asin(Math.sqrt(x));
}
var almacen={
  async leer(k){ try{
      if(window.storage){ var r=await window.storage.get(k,false); return r&&r.value?r.value:null; }
      return localStorage.getItem(k); }catch(e){ return null; } },
  async escribir(k,v){ try{
      if(window.storage){ await window.storage.set(k,v,false); return true; }
      localStorage.setItem(k,v); return true; }catch(e){ return false; } }
};

var GEO_KEY="catalogo-geografico-peajes";
var TARIFAS_KEY="paquete-tarifario-peajes";
var baseGeografica=null;
var paqueteTarifario=null;
var catalogoNacional=null;
var indiceCatalogo=null;

function esPuntoCatalogoConfiable(p){
  if(!p||p.latitude==null||p.longitude==null) return false;
  if(p.record_type==="tariff_class"||p.gps_verification_status==="no_aplica") return false;
  return ["usuario_manual","mop","usuario_mapa"].indexOf(p.gps_source_authority)>=0||
         ["verificada","verificada_manual","verificada_usuario"].indexOf(p.gps_verification_status)>=0||
         ["coincidencia_oficial","coordenada_manual","no_requiere_mop_para_uso"].indexOf(p.mop_match_status)>=0;
}
function tarifaActiva(t){
  if(!t) return false;
  if(String(t.payment_mode||"TAG").toUpperCase()!=="TAG") return false;
  return !/review_required|inactive/i.test(String(t.activation_status||"active"));
}
function prepararCatalogo(geo,tarifas){
  if(!geo||!Array.isArray(geo.points)||!Array.isArray(geo.routes))
    throw new Error("La base geográfica no contiene routes y points.");
  if(!tarifas||tarifas.format!=="peajes-tariff-package")
    throw new Error("El archivo tarifario no usa el formato anual esperado.");

  var rutas={}, tarifasPunto={}, tarifasGrupo={}, vinculosPunto={},
      tarifasViaje={}, viajes={}, modelosRuta={}, reglasTarifa={}, avoRoles={};

  geo.routes.forEach(function(r){ rutas[r.route_id]=r; });
  (tarifas.route_models||[]).forEach(function(m){ modelosRuta[m.route_id]=m; });

  (tarifas.point_tariffs||[]).filter(tarifaActiva).forEach(function(t){
    if(!tarifasPunto[t.point_id]) tarifasPunto[t.point_id]=[];
    tarifasPunto[t.point_id].push(t);
  });
  (tarifas.group_tariffs||[]).filter(tarifaActiva).forEach(function(t){
    if(!tarifasGrupo[t.group_id]) tarifasGrupo[t.group_id]=[];
    tarifasGrupo[t.group_id].push(t);
  });
  (tarifas.point_group_links||[]).forEach(function(l){
    if(!vinculosPunto[l.point_id]) vinculosPunto[l.point_id]=[];
    vinculosPunto[l.point_id].push(l);
  });
  (tarifas.journey_fares||[]).forEach(function(j){
    viajes[j.route_id+"|"+j.origin_code+"|"+j.destination_code]=j;
    if(j.route_id==="route_americo_vespucio_oriente_avo_i"){
      if(!avoRoles[j.origin_code]) avoRoles[j.origin_code]={
        origin:false,destination:false,directions:{}
      };
      if(!avoRoles[j.destination_code]) avoRoles[j.destination_code]={
        origin:false,destination:false,directions:{}
      };
      avoRoles[j.origin_code].origin=true;
      avoRoles[j.destination_code].destination=true;
      if(j.direction){
        avoRoles[j.origin_code].directions[j.direction]=true;
        avoRoles[j.destination_code].directions[j.direction]=true;
      }
    }
    tarifasViaje[j.journey_id]=Object.keys(j.fares||{}).map(function(tipo){
      return {
        tariff_id:j.journey_id+"__"+tipo,
        journey_id:j.journey_id,
        route_id:j.route_id,
        tariff_type:tipo,
        amount_clp:j.fares[tipo],
        payment_mode:"TAG",
        activation_status:j.activation_status,
        effective_from:j.effective_from,
        effective_to:j.effective_to,
        schedule_text:j.schedule&&j.schedule[tipo]||""
      };
    });
  });
  (tarifas.time_rules||[]).forEach(function(r){
    var id=r.target_tariff_id;
    if(!id) return;
    if(!reglasTarifa[id]) reglasTarifa[id]=[];
    reglasTarifa[id].push(r);
  });

  return {
    rutas:rutas,
    puntos:geo.points.filter(esPuntoCatalogoConfiable),
    tarifasPunto:tarifasPunto,
    tarifasGrupo:tarifasGrupo,
    vinculosPunto:vinculosPunto,
    tarifasViaje:tarifasViaje,
    viajes:viajes,
    modelosRuta:modelosRuta,
    reglasTarifa:reglasTarifa,
    avoRoles:avoRoles,
    pendientes:tarifas.pending_review||[],
    metadata:{
      generated_at:tarifas.manifest&&tarifas.manifest.generated_at,
      tariff_year:tarifas.manifest&&tarifas.manifest.year,
      geographic_generated_at:geo.metadata&&geo.metadata.generated_at
    }
  };
}
function refrescarResumenCatalogo(){
  var puntos=indiceCatalogo?indiceCatalogo.puntos.length:0;
  var ano=indiceCatalogo&&indiceCatalogo.metadata.tariff_year||"—";
  var tarifas=0;
  if(indiceCatalogo){
    Object.keys(indiceCatalogo.tarifasPunto).forEach(function(k){
      tarifas+=indiceCatalogo.tarifasPunto[k].length;
    });
    Object.keys(indiceCatalogo.tarifasGrupo).forEach(function(k){
      tarifas+=indiceCatalogo.tarifasGrupo[k].length;
    });
    Object.keys(indiceCatalogo.tarifasViaje).forEach(function(k){
      tarifas+=indiceCatalogo.tarifasViaje[k].length;
    });
  }
  $("datoPuntos").textContent=puntos;
  $("datoAno").textContent=ano;
  $("datoTarifas").textContent=tarifas;
  $("datoPendientes").textContent=indiceCatalogo?indiceCatalogo.pendientes.length:0;
  $("datoDescartados").textContent=diagnosticoDeteccion.descartados.length;
  $("datoAmbiguos").textContent=diagnosticoDeteccion.ambiguos.length;
}
function actualizarEstadoCatalogo(modo,mensaje){
  var e=$("catalogoEstado");
  if(!e) return;
  e.textContent=mensaje;
  e.className="catalogo-estado"+(modo?" "+modo:"");
  refrescarResumenCatalogo();
}
async function reconstruirCatalogo(guardarLocal){
  if(!baseGeografica||!paqueteTarifario){
    catalogoNacional=null; indiceCatalogo=null;
    actualizarEstadoCatalogo("","Falta cargar la base geográfica o el paquete tarifario.");
    if(circuito) recalcular(false);
    return;
  }
  indiceCatalogo=prepararCatalogo(baseGeografica,paqueteTarifario);
  catalogoNacional={
    format:"catalogo-calculadora-peajes",
    version:2,
    geographic_catalog:baseGeografica,
    tariff_package:paqueteTarifario
  };
  if(guardarLocal){
    await almacen.escribir(GEO_KEY,JSON.stringify(baseGeografica));
    await almacen.escribir(TARIFAS_KEY,JSON.stringify(paqueteTarifario));
  }
  var ano=indiceCatalogo.metadata.tariff_year||"—";
  actualizarEstadoCatalogo("activo",
    "Datos activos: "+indiceCatalogo.puntos.length+" pórticos utilizables · tarifas TAG "+ano+" · selección de calzada v4 · AVO estricto v2.");
  if(circuito) recalcular(false);
}
async function cargarCatalogoDatos(d,guardarLocal){
  if(d&&d.format==="catalogo-calculadora-peajes"&&Number(d.version)>=2){
    baseGeografica=d.geographic_catalog;
    paqueteTarifario=d.tariff_package;
  }else if(d&&d.format==="catalogo-geografico-peajes"){
    baseGeografica=d;
  }else if(d&&d.format==="peajes-tariff-package"){
    paqueteTarifario=d;
  }else if(d&&Array.isArray(d.routes)&&Array.isArray(d.points)&&Array.isArray(d.tariffs)){
    throw new Error("Este es un catálogo antiguo. Carga la base geográfica v11 y el paquete tarifario anual.");
  }else{
    throw new Error("Formato de archivo no reconocido.");
  }
  await reconstruirCatalogo(guardarLocal);
}
async function leerJsonDesdeArchivo(file,tipo){
  var nombre=(file&&file.name||"").toLowerCase();
  if(!nombre.endsWith(".zip")) return JSON.parse(await file.text());
  if(typeof JSZip==="undefined") throw new Error("No se pudo cargar la librería para abrir ZIP.");
  var zip=await JSZip.loadAsync(await file.arrayBuffer());
  var candidatos=tipo==="geo"
    ? ["catalogo_geografico_peajes_2026.json"]
    : tipo==="tarifas"
      ? ["tarifas_tag_2026.json"]
      : ["catalogo_calculadora_peajes_2026.json","tarifas_tag_2026.json",
         "catalogo_geografico_peajes_2026.json"];
  var entrada=null;
  for(var i=0;i<candidatos.length&&!entrada;i++) entrada=zip.file(candidatos[i]);
  if(!entrada){
    entrada=Object.values(zip.files).find(function(x){
      if(x.dir||!/\.json$/i.test(x.name)) return false;
      if(tipo==="geo") return /catalogo_geografico/i.test(x.name);
      if(tipo==="tarifas") return /tarifas_tag/i.test(x.name);
      return /catalogo_calculadora|tarifas_tag|catalogo_geografico/i.test(x.name);
    });
  }
  if(!entrada) throw new Error("El ZIP no contiene un JSON compatible.");
  return JSON.parse(await entrada.async("text"));
}
async function cargarCatalogoArchivo(file,tipo){
  var d=await leerJsonDesdeArchivo(file,tipo);
  await cargarCatalogoDatos(d,true);
}
async function restaurarCatalogoIncluido(){
  baseGeografica=window.CATALOGO_GEOGRAFICO_INCLUIDO;
  paqueteTarifario=window.PAQUETE_TARIFARIO_INCLUIDO;
  await reconstruirCatalogo(true);
}
async function quitarCatalogo(){
  baseGeografica=null; paqueteTarifario=null;
  catalogoNacional=null; indiceCatalogo=null;
  try{
    localStorage.removeItem(GEO_KEY);
    localStorage.removeItem(TARIFAS_KEY);
  }catch(e){}
  actualizarEstadoCatalogo("","Sin datos nacionales cargados. Los peajes no se calcularán.");
  if(circuito) recalcular(false);
}

/* ============================================================
   Coordenadas
   ============================================================ */
/* Normaliza lo que pega la gente: comillas curvas del teclado del celular,
   primas tipográficas, espacios duros, símbolos de grado alternativos. */
function normalizarTexto(t){
  return String(t||"")
    .replace(/[\u2018\u2019\u02B9\u2032\u00B4\u0060]/g,"'")
    .replace(/[\u201C\u201D\u02BA\u2033\u3003]/g,'"')
    .replace(/[\u00BA\u02DA\u030A\u2218]/g,"\u00B0")
    .replace(/[\u00A0\u202F\u2009\u200A]/g," ")
    .replace(/\s+/g," ")
    .trim();
}

var RE_DMS=/(\d{1,3})\s*\u00B0\s*(\d{1,2})\s*'?\s*(?:([\d.,]+)\s*"?)?\s*([NSEWOnsewo])/;

function interpretarCoordenadas(bruto){
  var t=normalizarTexto(bruto);
  if(!t) return null;

  /* --- Enlaces de Google Maps --- */
  if(/https?:\/\//i.test(t)||/maps\./i.test(t)){
    var u=t.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/)||
          t.match(/[?&]q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/)||
          t.match(/[?&]ll=(-?\d+\.\d+),\s*(-?\d+\.\d+)/)||
          t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if(u) return validar(parseFloat(u[1]),parseFloat(u[2]),"enlace de Google Maps");
    if(/goo\.gl|maps\.app/i.test(t)) return {error:
      "Los enlaces cortos de Google Maps no se resuelven desde el navegador. "+
      "Ábrelo en Maps, toca el pin y copia las coordenadas."};
    return null;
  }

  /* --- Grados, minutos y segundos --- */
  var trozos=t.match(new RegExp(RE_DMS.source,"g"));
  if(trozos&&trozos.length){
    var la=null, lo=null;
    trozos.slice(0,2).forEach(function(trozo){
      var m=trozo.match(RE_DMS);
      var g=parseFloat(m[1])+parseFloat(m[2])/60+
            (m[3]?parseFloat(m[3].replace(",","."))/3600:0);
      var h=m[4].toUpperCase();
      if(h==="S"||h==="W"||h==="O") g=-g;
      if(h==="N"||h==="S") la=g; else lo=g;
    });
    if(la!==null&&lo!==null) return validar(la,lo,"grados, minutos y segundos");
    if(la!==null||lo!==null) return {error:
      "Reconocí solo una de las dos coordenadas. Revisa que estén las dos, "+
      "por ejemplo 33\u00B028'08.2\"S 70\u00B034'55.1\"W."};
  }

  var limpio=t.replace(/[()\[\]]/g,"").trim();

  /* --- Decimal con letra de hemisferio: 33.4689 S, 70.5820 W --- */
  var conLetra=limpio.match(
    /^(\d{1,3}(?:[.,]\d+)?)\s*\u00B0?\s*([NSns])\s*[,; ]\s*(\d{1,3}(?:[.,]\d+)?)\s*\u00B0?\s*([EWOewo])$/);
  if(conLetra){
    var lat=parseFloat(conLetra[1].replace(",","."));
    var lon=parseFloat(conLetra[3].replace(",","."));
    if(conLetra[2].toUpperCase()==="S") lat=-lat;
    if(conLetra[4].toUpperCase()!=="E") lon=-lon;
    return validar(lat,lon,"coordenadas con hemisferio");
  }

  /* --- Par decimal --- */
  var par=null;
  var m1=limpio.match(/^(-?\d{1,3},\d+)\s*[;,]\s*(-?\d{1,3},\d+)$/);
  if(m1) par=[m1[1].replace(",","."),m1[2].replace(",",".")];
  if(!par){
    var m2=limpio.match(/^(-?\d{1,3}(?:\.\d+)?)\s*[;,\s]\s*(-?\d{1,3}(?:\.\d+)?)$/);
    if(m2) par=[m2[1],m2[2]];
  }
  if(!par){
    var m3=limpio.match(/^(-?\d{1,3},\d+)\s+(-?\d{1,3},\d+)$/);
    if(m3) par=[m3[1].replace(",","."),m3[2].replace(",",".")];
  }
  if(par) return validar(parseFloat(par[0]),parseFloat(par[1]),"coordenadas");

  return null;
}

function enChile(lat,lon){
  return lat<-17 && lat>-56 && lon<-66 && lon>-110;
}

function validar(a,b,origen){
  if(!isFinite(a)||!isFinite(b)) return null;

  /* Pegadas como longitud, latitud */
  var inv=Math.abs(a)>60&&Math.abs(b)<60;
  var lat=inv?b:a, lon=inv?a:b;
  if(Math.abs(lat)>90||Math.abs(lon)>180) return null;

  if(enChile(lat,lon))
    return {lat:lat,lon:lon,origen:origen,invertido:inv,fueraDeChile:false};

  /* Falta el signo: en Chile ambas son negativas. Si al negarlas cae
     dentro del país, casi seguro es eso. Se avisa, no se asume en silencio. */
  if(enChile(-Math.abs(lat),-Math.abs(lon)))
    return {lat:-Math.abs(lat), lon:-Math.abs(lon), origen:origen+" (les faltaba el signo negativo)",
            invertido:inv, fueraDeChile:false, corregido:true};

  return {lat:lat,lon:lon,origen:origen,invertido:inv,fueraDeChile:true,
          leido:lat.toFixed(4)+", "+lon.toFixed(4)};
}

/* ============================================================
   Servicios
   ============================================================ */
var CAB={"Accept":"application/json"};

/* Traduce fallas de red a algo accionable. "Failed to fetch" es lo que
   devuelve el navegador cuando no logra salir: sin conexión, o corriendo
   dentro de una vista previa que bloquea llamadas externas. */
function mensajeDeError(err){
  var m=(err&&err.message)||String(err);
  if(/failed to fetch|networkerror|load failed|typeerror/i.test(m)){
    return "No se pudo contactar el servicio de mapas. Si estás viendo esto dentro "+
           "del chat, descarga el archivo y ábrelo en tu navegador: ahí las llamadas "+
           "externas sí funcionan. Si ya lo abriste como archivo, revisa tu conexión.";
  }
  return m;
}

async function geocodificar(t){
  var r=await fetch("https://nominatim.openstreetmap.org/search?"+new URLSearchParams({
    q:t, format:"json", countrycodes:"cl", limit:"5", addressdetails:"1"}),{headers:CAB});
  if(!r.ok) throw new Error("El buscador de direcciones no respondió.");
  return await r.json();
}
async function nombreDeCoordenadas(lat,lon){
  try{
    var r=await fetch("https://nominatim.openstreetmap.org/reverse?"+new URLSearchParams({
      lat:String(lat),lon:String(lon),format:"json",zoom:"18"}),{headers:CAB});
    if(!r.ok) return null;
    var d=await r.json();
    return d&&d.display_name?d.display_name:null;
  }catch(e){ return null; }
}
function cadena(puntos){
  return puntos.map(function(p){ return p[1]+","+p[0]; }).join(";");
}
/* Circuito optimizado: OSRM resuelve el orden de visita. */
async function optimizar(puntos,modo){
  var volverBase=modo==="base";
  var opciones=volverBase
    ? "?source=first&roundtrip=true&overview=full&geometries=geojson&steps=true"
    : "?source=first&destination=last&roundtrip=false&overview=full&geometries=geojson&steps=true";
  var url="https://router.project-osrm.org/trip/v1/driving/"+cadena(puntos)+opciones;
  var r=await fetch(url,{headers:CAB});
  if(!r.ok) throw new Error("El optimizador de rutas no respondió.");
  var j=await r.json();
  if(j.code!=="Ok"||!j.trips||!j.trips.length)
    throw new Error("No se pudo armar un circuito con esas paradas.");
  return j;
}
/* Circuito respetando el orden dado. */
async function circuitoFijo(puntos,modo){
  var lista=modo==="base"?puntos.concat([puntos[0]]):puntos.slice();
  var url="https://router.project-osrm.org/route/v1/driving/"+cadena(lista)+
    "?overview=full&geometries=geojson&steps=true";
  var r=await fetch(url,{headers:CAB});
  if(!r.ok) throw new Error("El servicio de rutas no respondió.");
  var j=await r.json();
  if(j.code!=="Ok"||!j.routes||!j.routes.length)
    throw new Error("No se encontró una ruta manejable entre esas paradas.");
  return j.routes[0];
}

function geometriaDeLeg(leg){
  var out=[];
  (leg.steps||[]).forEach(function(s){
    var cs=s.geometry&&s.geometry.coordinates||[];
    cs.forEach(function(c){
      var p=[c[1],c[0]], ult=out[out.length-1];
      if(!ult||ult[0]!==p[0]||ult[1]!==p[1]) out.push(p);
    });
  });
  return out;
}
function geometriaLegs(ruta){
  return (ruta.legs||[]).map(geometriaDeLeg);
}
function distanciaPuntoSegmento(p,a,b){
  var rad=Math.PI/180, R=6371000;
  var cos=Math.cos(p[0]*rad);
  var ax=(a[1]-p[1])*rad*R*cos, ay=(a[0]-p[0])*rad*R;
  var bx=(b[1]-p[1])*rad*R*cos, by=(b[0]-p[0])*rad*R;
  var dx=bx-ax, dy=by-ay, den=dx*dx+dy*dy;
  var t=den?-(ax*dx+ay*dy)/den:0;
  t=Math.max(0,Math.min(1,t));
  var x=ax+t*dx, y=ay+t*dy;
  return {dist:Math.sqrt(x*x+y*y),t:t,dx:dx,dy:dy};
}
function puntoMasCercano(p,geo){
  var mejor={dist:Infinity,idx:0,t:0,dx:0,dy:0};
  for(var i=0;i<geo.length-1;i++){
    var r=distanciaPuntoSegmento(p,geo[i],geo[i+1]);
    if(r.dist<mejor.dist) mejor={dist:r.dist,idx:i,t:r.t,dx:r.dx,dy:r.dy};
  }
  return mejor;
}
function progresoRutaMetros(geo,cerca){
  var total=0;
  for(var i=0;i<cerca.idx;i++) total+=haversine(geo[i],geo[i+1]);
  if(geo[cerca.idx]&&geo[cerca.idx+1])
    total+=haversine(geo[cerca.idx],geo[cerca.idx+1])*cerca.t;
  return total;
}
function codigoAvoValido(codigo){
  return /^P\d+$/i.test(String(codigo||""));
}
function descripcionCandidatoAvo(p){
  return (p.codigo||"?")+" "+(p.nombre||"").replace(/^P\d+\s*/i,"").trim();
}


function direccionOperacionalPunto(p){
  if(!p) return "";
  return p.travel_direction||p.direction||p.mop_sentido||"";
}
function direccionEsperada(texto){
  var s=clave(texto||"").replace(/á/g,"a").replace(/é/g,"e").replace(/í/g,"i")
    .replace(/ó/g,"o").replace(/ú/g,"u").replace(/[–—]/g,"-");

  if(/sur\s*(?:-|a|→|hacia)\s*norte/.test(s)||
     /sentido\s*norte/.test(s)||/hacia\s+el?\s*norte/.test(s)||
     /^(norte|northbound)$/.test(s)) return [0,1];

  if(/norte\s*(?:-|a|→|hacia)\s*sur/.test(s)||
     /sentido\s*sur/.test(s)||/hacia\s+el?\s*sur/.test(s)||
     /^(sur|southbound)$/.test(s)) return [0,-1];

  if(/poniente\s*(?:-|a|→|hacia)\s*oriente/.test(s)||
     /oeste\s*(?:-|a|→|hacia)\s*este/.test(s)||
     /sentido\s*oriente/.test(s)||/hacia\s+el?\s*oriente/.test(s)||
     /^(oriente|este|eastbound)$/.test(s)) return [1,0];

  if(/oriente\s*(?:-|a|→|hacia)\s*poniente/.test(s)||
     /este\s*(?:-|a|→|hacia)\s*oeste/.test(s)||
     /sentido\s*poniente/.test(s)||/hacia\s+el?\s*poniente/.test(s)||
     /^(poniente|oeste|westbound)$/.test(s)) return [-1,0];

  return null;
}
function distanciaGeo(a,b){ return haversine(a,b); }
function puntoAUnaDistancia(geo,indice,pasos,distanciaObjetivo){
  var i=indice,recorrido=0,anterior=geo[i];
  while(true){
    var siguiente=i+pasos;
    if(siguiente<0||siguiente>=geo.length) break;
    recorrido+=distanciaGeo(anterior,geo[siguiente]);
    i=siguiente;
    anterior=geo[i];
    if(recorrido>=distanciaObjetivo) break;
  }
  return geo[i];
}
function vectorRutaAdaptativo(geo,cerca){
  if(!geo||geo.length<2) return null;
  var indice=Math.max(0,Math.min(geo.length-1,cerca.idx));
  var a=puntoAUnaDistancia(geo,indice,-1,85);
  var b=puntoAUnaDistancia(geo,Math.min(geo.length-1,indice+1),1,85);
  var rad=Math.PI/180,latMedia=(a[0]+b[0])/2*rad;
  var dx=(b[1]-a[1])*Math.cos(latMedia),dy=b[0]-a[0];
  var norma=Math.sqrt(dx*dx+dy*dy);
  if(!norma) return null;
  return [dx/norma,dy/norma];
}
function puntajeDireccion(texto,cerca,geo){
  var esperada=direccionEsperada(texto);
  if(!esperada) return null;
  var vector=vectorRutaAdaptativo(geo,cerca);
  if(!vector) return null;
  return vector[0]*esperada[0]+vector[1]*esperada[1];
}
function umbralEspacialPunto(p,tieneDireccion){
  var autoridad=String(p.gps_source_authority||"").toLowerCase();
  var exacto=Number(p.gps_is_exact)===1||
    /verificada|exact/i.test(String(p.gps_verification_status||""));
  if(tieneDireccion){
    if(autoridad==="mop"||exacto) return 95;
    if(autoridad==="usuario_manual"||autoridad==="usuario_mapa") return 105;
    return 80;
  }
  /* Sin sentido conocido se exige mayor cercanía para evitar una calzada vecina. */
  if(autoridad==="mop"||exacto) return 42;
  if(autoridad==="usuario_manual"||autoridad==="usuario_mapa") return 50;
  return 32;
}
function evaluarCandidatoPunto(p,cerca,geo){
  var direccion=direccionOperacionalPunto(p);
  var tieneDireccion=!!direccionEsperada(direccion);
  var umbral=umbralEspacialPunto(p,tieneDireccion);
  var espacial=Math.max(0,1-cerca.dist/umbral);
  var direccionScore=tieneDireccion?puntajeDireccion(direccion,cerca,geo):null;

  if(cerca.dist>umbral){
    return {aceptado:false,motivo:"distancia",direccion:direccion,
      distancia:cerca.dist,umbral:umbral,puntaje:-1};
  }
  if(tieneDireccion&&direccionScore!==null&&direccionScore<0.30){
    return {aceptado:false,motivo:"sentido_contrario",direccion:direccion,
      distancia:cerca.dist,umbral:umbral,direccionScore:direccionScore,puntaje:-1};
  }

  var total=tieneDireccion
    ? 0.58*((direccionScore+1)/2)+0.42*espacial
    : espacial*0.72;
  var minimo=tieneDireccion?0.50:0.58;

  return {
    aceptado:total>=minimo,
    motivo:total>=minimo?"aceptado":"baja_confianza",
    direccion:direccion,
    distancia:cerca.dist,
    umbral:umbral,
    direccionScore:direccionScore,
    puntaje:total,
    confianza:total>=0.78?"segura":(total>=minimo?"media":"baja")
  };
}
function coincideDireccion(texto,cerca,geo){
  var puntaje=puntajeDireccion(texto,cerca,geo);
  if(puntaje===null) return true;
  return puntaje>=0.30;
}
function sentidoCardinal(desde,hacia){
  var dy=hacia[0]-desde[0], dx=hacia[1]-desde[1];
  if(Math.abs(dx)>Math.abs(dy)) return dx<0?"poniente":"oriente";
  return dy<0?"sur":"norte";
}

/* ============================================================
   Estado
   ============================================================ */
var diagnosticoDeteccion={descartados:[],aceptados:[],ambiguos:[]};
var tipoNuevaParada="propiedad";
var googleMapsEtapas=[];
var modoFin="base";       /* base | ultima | otra */
var destinoFinal=null;    /* {lat,lon,etiqueta} cuando modoFin === "otra" */
var base=null;
var paradas=[];          /* [{lat,lon,etiqueta}] en el orden actual */
var circuito=null;       /* {km,min,geometria,legs,legGeometrias,peajes} */
var comparacion=null;    /* {kmOriginal,minOriginal} */
var horaSalida="09:00";
var selectorHoraAbierto=false;
var horaPendiente="09:00";
var fechaPendiente="";
var mapa=null, capaRuta=null, capaPuntos=null, temporizador;

function fechaElegida(){
  var v=$("fecha").value;
  if(!v) return new Date();
  var p=v.split("-");
  return new Date(parseInt(p[0],10),parseInt(p[1],10)-1,parseInt(p[2],10));
}

/* Horario completo: un registro por propiedad y uno por cada tramo vial. */
function tipoParada(p){
  return p&&["propiedad","tecnica"].indexOf(p.tipo)>=0?p.tipo:"propiedad";
}
function etiquetaTipoParada(p){
  return tipoParada(p)==="tecnica"?"Parada técnica":"Propiedad";
}
function duracionParada(p){
  if(tipoParada(p)==="propiedad") return num("minSitio");
  var minutos=Number(p.minutosTecnicos);
  return Math.max(0,isFinite(minutos)?minutos:15);
}
function normalizarParadas(){
  var habiaFinalAntiguo=false;
  paradas.forEach(function(p){
    /* Migración de la v5.4: una antigua “última parada” pasa a ser una
       parada técnica de duración cero y activa el final en la última parada. */
    if(p.tipo==="final"){
      p.tipo="tecnica";
      p.minutosTecnicos=0;
      habiaFinalAntiguo=true;
    }
    p.tipo=tipoParada(p);
    if(p.tipo==="tecnica"&&!isFinite(Number(p.minutosTecnicos)))
      p.minutosTecnicos=15;
  });
  if(habiaFinalAntiguo&&modoFin==="base") modoFin="ultima";
}
function cambiarTipoParada(indice,tipo){
  if(!paradas[indice]||["propiedad","tecnica"].indexOf(tipo)<0) return;
  paradas[indice].tipo=tipo;
  if(tipo==="tecnica"&&!isFinite(Number(paradas[indice].minutosTecnicos)))
    paradas[indice].minutosTecnicos=15;
  recalcular(false);
}
function modoFinValido(valor){
  return ["base","ultima","otra"].indexOf(valor)>=0?valor:"base";
}
function regresaALaBase(){
  return modoFin==="base";
}
function finalExternoConfigurado(){
  return modoFin==="otra"&&destinoFinal&&isFinite(Number(destinoFinal.lat))&&
    isFinite(Number(destinoFinal.lon));
}
function finalRutaValido(){
  if(modoFin==="base") return true;
  if(modoFin==="ultima") return paradas.length>0;
  return finalExternoConfigurado();
}
function nombreTramoParada(p,indice){
  if(!p) return "Base";
  if(destinoFinal&&p===destinoFinal) return "Destino final · "+(p.etiqueta||"Otra dirección").split(",")[0];
  var principal=(p.etiqueta||("Parada "+(indice+1))).split(",")[0];
  return tipoParada(p)==="tecnica"
    ?"Técnica · "+principal
    :"Propiedad "+(indice+1)+" · "+principal;
}
function puntosParaRuta(){
  var puntos=[[base.lat,base.lon]].concat(paradas.map(function(p){return [p.lat,p.lon];}));
  if(modoFin==="otra"&&destinoFinal)
    puntos.push([destinoFinal.lat,destinoFinal.lon]);
  return puntos;
}
function cantidadParadasOptimizables(){
  if(modoFin==="ultima") return Math.max(0,paradas.length-1);
  return paradas.length;
}
function agenda(){
  if(!circuito) return null;
  var t=minutosDe(horaSalida);
  var filas=[],tramos=[];
  paradas.forEach(function(p,i){
    var desde=i===0?base:paradas[i-1];
    tramos.push({
      indice:i,desde:desde,hacia:p,salida:t,
      sentido:sentidoCardinal([desde.lat,desde.lon],[p.lat,p.lon]),
      clase:"parada"
    });
    t+=circuito.legs[i]||0;
    var llegada=t;
    var duracion=duracionParada(p);
    t+=duracion;
    filas.push({
      parada:p,llegada:llegada,salida:t,duracion:duracion,
      tipo:tipoParada(p)
    });
  });

  var regreso=null,llegadaFinal=null;
  if(modoFin==="base"&&paradas.length){
    var ultima=paradas[paradas.length-1];
    tramos.push({
      indice:paradas.length,desde:ultima,hacia:base,salida:t,
      sentido:sentidoCardinal([ultima.lat,ultima.lon],[base.lat,base.lon]),
      clase:"regreso"
    });
    regreso=t+(circuito.legs[paradas.length]||0);
  }else if(modoFin==="otra"&&destinoFinal&&paradas.length){
    var desdeFinal=paradas[paradas.length-1];
    tramos.push({
      indice:paradas.length,desde:desdeFinal,hacia:destinoFinal,salida:t,
      sentido:sentidoCardinal([desdeFinal.lat,desdeFinal.lon],
        [destinoFinal.lat,destinoFinal.lon]),
      clase:"destino_final"
    });
    llegadaFinal=t+(circuito.legs[paradas.length]||0);
  }

  var fin=regreso!==null?regreso:(llegadaFinal!==null?llegadaFinal:t);
  return {
    filas:filas,tramos:tramos,salidaBase:minutosDe(horaSalida),
    regreso:regreso,llegadaFinal:llegadaFinal,fin:fin,
    regresaBase:regreso!==null,modoFin:modoFin,
    salidaUltima:filas.length?filas[filas.length-1].salida:minutosDe(horaSalida)
  };
}

/* ============================================================
   Catálogo nacional MOP y detección por tramo
   ============================================================ */
function filasTarifaPunto(p){
  if(!indiceCatalogo) return [];
  var filas=(indiceCatalogo.tarifasPunto[p.point_id]||[]).slice();
  (indiceCatalogo.vinculosPunto[p.point_id]||[]).forEach(function(v){
    if(v.link_status==="active"||v.link_status==="provisional")
      filas=filas.concat(indiceCatalogo.tarifasGrupo[v.group_id]||[]);
  });
  return filas.filter(function(t){
    var tipo=String(t.tariff_type||"").toUpperCase();
    return tarifaActiva(t)&&!/INFRACTOR|PASE_DIARIO|SIN_TAG|COBRO_POR_PASADA/.test(tipo);
  });
}
function esHoraPuntaGenerica(fecha,min){
  var dia=fecha.getDay();
  return dia>=1&&dia<=5&&((min>=450&&min<570)||(min>=1050&&min<1170));
}
function tarifaVigenteEnFecha(t,fecha){
  var iso=fecha.getFullYear()+"-"+String(fecha.getMonth()+1).padStart(2,"0")+"-"+
    String(fecha.getDate()).padStart(2,"0");
  return (!t.effective_from||iso>=t.effective_from)&&(!t.effective_to||iso<=t.effective_to);
}
function elegirTarifaFilas(filas,fecha,min,routeId,sentido,punto){
  filas=filas.filter(function(t){ return tarifaVigenteEnFecha(t,fecha); });
  if(!filas.length) return null;

  var porTipo={};
  filas.forEach(function(t){
    porTipo[String(t.tariff_type||"").toUpperCase()]=t;
  });

  var punta=false,elegida=null,horarioEstimado=false,horarioFuente="fijo";

  var exacta=tipoTarifaPorHorarioPortico(filas,fecha,min,punto);
  if(exacta&&porTipo[exacta.tipo]){
    elegida=porTipo[exacta.tipo];
    horarioFuente="oficial_portico";
  }

  if(!elegida) ["TS","TBP","PUNTA"].some(function(tipoBuscado){
    var fila=porTipo[tipoBuscado];
    if(!fila) return false;
    if(horarioEtiquetadoCoincide(fila.schedule_text,fecha,min)===true){
      elegida=fila;
      horarioFuente="oficial";
      return true;
    }
    return false;
  });

  if(!elegida&&(porTipo.TBFP||porTipo.TBP||porTipo.TS)&&
     routeId==="route_americo_vespucio_oriente_avo_i"){
    var diaAvo=tipoDiaTarifario(fecha);
    punta=diaAvo==="laboral"&&((min>=450&&min<570)||(min>=1050&&min<1170));
    elegida=punta?(porTipo.TBP||porTipo.TS||porTipo.TBFP):(porTipo.TBFP||porTipo.TBP||porTipo.TS);
    horarioFuente="oficial";
  }

  if(!elegida&&(porTipo.NORMAL||porTipo.PUNTA)){
    if(routeId==="route_acceso_nororiente"){
      punta=REGLAS.nororiente(fecha,min);
      horarioFuente="oficial";
    }else if(routeId==="route_ruta_68_santiago_valparaiso_vina"){
      punta=REGLAS.r68(fecha,min,sentido);
      horarioFuente="oficial";
    }else if(routeId==="route_ruta_60_ch"){
      punta=REGLAS.r60(fecha,min,sentido);
      horarioFuente="oficial";
    }else if(routeId==="route_ruta_78"){
      punta=REGLAS.r78(fecha,min,sentido);
      horarioFuente="oficial";
    }else{
      punta=esHoraPuntaGenerica(fecha,min);
      horarioEstimado=true;
      horarioFuente="estimado";
    }
    elegida=punta?(porTipo.PUNTA||porTipo.NORMAL):(porTipo.NORMAL||porTipo.PUNTA);
  }

  if(!elegida&&(porTipo.TBFP||porTipo.TBP||porTipo.TS)){
    var interpretable=filas.some(function(t){
      var tt=String(t.tariff_type||"").toUpperCase();
      return /TBP|TS/.test(tt)&&horarioEtiquetadoCoincide(t.schedule_text,fecha,min)!==null;
    });
    if(interpretable){
      elegida=porTipo.TBFP||porTipo.TBP||porTipo.TS;
      horarioFuente="oficial";
    }else{
      punta=esHoraPuntaGenerica(fecha,min);
      horarioEstimado=true;
      horarioFuente="estimado";
      elegida=punta?(porTipo.TBP||porTipo.TS||porTipo.TBFP):(porTipo.TBFP||porTipo.TBP||porTipo.TS);
    }
  }

  if(!elegida){
    elegida=porTipo["ÚNICA"]||porTipo.UNICA||porTipo["PÓRTICO"]||porTipo.PORTICO||
            porTipo.TAG_HABILITADO||porTipo.CON_TAG||porTipo.TRONCAL||porTipo.LATERAL||
            porTipo.TS||filas[0];
  }
  if(!elegida) return null;

  var tipoElegido=String(elegida.tariff_type||"").toUpperCase();
  punta=/TBP|TS|PUNTA/.test(tipoElegido);
  return {
    monto:Number(elegida.amount_clp)||0,
    punta:punta,
    tipo:elegida.tariff_type||"",
    fila:elegida,
    horarioEstimado:horarioEstimado,
    horarioFuente:horarioFuente,
    diaTarifario:tipoDiaTarifario(fecha),
    reglaDetalle:exacta&&horarioFuente==="oficial_portico"?exacta.detalle:
      (horarioFuente==="oficial"?(elegida.schedule_text||""):"")
  };
}

function crearCobroPunto(p,tramo,cerca,geo,evaluacion){
  var r=indiceCatalogo.rutas[p.route_id]||{};
  var direccion=direccionOperacionalPunto(p);
  return {
    catalogo:true,point_id:p.point_id,route_id:p.route_id,
    codigo:p.code||"",nombre:p.name||p.code||"Pórtico",
    operador:p.concession_name||r.concession_name||r.name||"",
    ruta:r.name||p.route_id,lat:Number(p.latitude),lon:Number(p.longitude),
    direccion:direccion,sinDireccion:!direccionEsperada(direccion),
    direccionFuente:p.source_direction||p.direction||p.mop_sentido||"",
    puntajeDireccion:evaluacion.direccionScore,
    puntajeDeteccion:evaluacion.puntaje,
    confianzaDeteccion:evaluacion.confianza,
    crossing_cluster_id:p.crossing_cluster_id||p.point_id,
    crossing_cluster_size:Number(p.crossing_cluster_size)||1,
    tramo:tramo,posicion:cerca.idx+cerca.t,distanciaRuta:cerca.dist,
    progresoRutaM:progresoRutaMetros(geo,cerca),
    reference:p.reference||"",
    tariff_group_point_id:p.tariff_group_point_id||null
  };
}

function seleccionarMejorPorCruce(lista){
  var grupos={};
  lista.forEach(function(p){
    var claveGrupo=p.crossing_cluster_id||p.point_id;
    if(!grupos[claveGrupo]) grupos[claveGrupo]=[];
    grupos[claveGrupo].push(p);
  });

  var salida=[];
  Object.keys(grupos).forEach(function(claveGrupo){
    var candidatos=grupos[claveGrupo];
    if(candidatos.length===1){
      salida.push(candidatos[0]);
      return;
    }

    var direccionales=candidatos.filter(function(p){
      return !!direccionEsperada(p.direccion);
    });
    var compatibles=direccionales.filter(function(p){
      return p.puntajeDireccion!=null&&p.puntajeDireccion>=0.45;
    });

    var mejor=null,regla="";

    if(compatibles.length){
      /* En calzadas opuestas manda la alineación del sentido, aunque el
         detector contrario esté unos metros más cerca. */
      compatibles.sort(function(a,b){
        if(b.puntajeDireccion!==a.puntajeDireccion)
          return b.puntajeDireccion-a.puntajeDireccion;
        if(b.puntajeDeteccion!==a.puntajeDeteccion)
          return b.puntajeDeteccion-a.puntajeDeteccion;
        return a.distanciaRuta-b.distanciaRuta;
      });
      mejor=compatibles[0];
      regla="sentido_compatible";
    }else if(direccionales.length){
      /* Hay direcciones publicadas, pero ninguna coincide suficientemente
         con el recorrido. Cobrar por cercanía sería inseguro. */
      diagnosticoDeteccion.ambiguos.push({
        crossing_cluster_id:claveGrupo,
        route_id:candidatos[0].route_id,
        motivo:"ninguna_calzada_direccional_coincide",
        candidatos:candidatos.map(function(p){return p.point_id;})
      });
      candidatos.forEach(function(p){
        diagnosticoDeteccion.descartados.push({
          point_id:p.point_id,route_id:p.route_id,codigo:p.codigo,
          motivo:"cruce_direccional_ambiguo",crossing_cluster_id:claveGrupo
        });
      });
      return;
    }else{
      /* Sin dirección solo se acepta un ganador espacial claramente separado.
         Si los dos pórticos están casi juntos, el cruce queda pendiente. */
      candidatos.sort(function(a,b){ return a.distanciaRuta-b.distanciaRuta; });
      var primero=candidatos[0],segundo=candidatos[1];
      var diferencia=segundo?segundo.distanciaRuta-primero.distanciaRuta:Infinity;
      var proporcion=segundo&&segundo.distanciaRuta>0
        ? primero.distanciaRuta/segundo.distanciaRuta:0;

      if(
        primero.distanciaRuta<=25 &&
        (diferencia>=8||proporcion<=0.58)
      ){
        mejor=primero;
        regla="distancia_claramente_mejor";
      }else{
        diagnosticoDeteccion.ambiguos.push({
          crossing_cluster_id:claveGrupo,
          route_id:candidatos[0].route_id,
          motivo:"porticos_adyacentes_sin_sentido",
          distancia_primero:primero.distanciaRuta,
          distancia_segundo:segundo?segundo.distanciaRuta:null,
          candidatos:candidatos.map(function(p){return p.point_id;})
        });
        candidatos.forEach(function(p){
          diagnosticoDeteccion.descartados.push({
            point_id:p.point_id,route_id:p.route_id,codigo:p.codigo,
            motivo:"cruce_sin_sentido_ambiguo",crossing_cluster_id:claveGrupo
          });
        });
        return;
      }
    }

    mejor.reglaSeleccionCruce=regla;
    salida.push(mejor);
    candidatos.forEach(function(descartado){
      if(descartado.point_id===mejor.point_id) return;
      diagnosticoDeteccion.descartados.push({
        point_id:descartado.point_id,route_id:descartado.route_id,
        codigo:descartado.codigo,motivo:"alternativa_mismo_cruce",
        crossing_cluster_id:claveGrupo,conservado:mejor.point_id,
        regla:regla,puntaje:descartado.puntajeDeteccion
      });
    });
  });
  return salida.sort(function(a,b){ return a.posicion-b.posicion; });
}
function depurarCrucesSinDireccion(lista){
  var out=[];
  lista.forEach(function(p){
    var candidato=-1;
    for(var i=out.length-1;i>=0;i--){
      var q=out[i];
      if(q.route_id!==p.route_id) continue;
      if(!q.sinDireccion||!p.sinDireccion) break;
      if(haversine([q.lat,q.lon],[p.lat,p.lon])<=180){ candidato=i; break; }
      if(p.posicion-q.posicion>25) break;
    }
    if(candidato<0) out.push(p);
    else if(p.distanciaRuta<out[candidato].distanciaRuta) out[candidato]=p;
  });
  return out;
}
function candidatoAvoUnicoPorCodigo(cruces){
  var porCodigo={};
  cruces.forEach(function(p){
    if(!codigoAvoValido(p.codigo)||p.codigo==="P110") return;
    var actual=porCodigo[p.codigo];
    if(!actual||
       p.puntajeDeteccion>actual.puntajeDeteccion||
       (p.puntajeDeteccion===actual.puntajeDeteccion&&
        p.distanciaRuta<actual.distanciaRuta)){
      porCodigo[p.codigo]=p;
    }
  });
  return Object.keys(porCodigo).map(function(k){return porCodigo[k];})
    .sort(function(a,b){return a.progresoRutaM-b.progresoRutaM;});
}
function crearAvoAmbiguo(cruces,tramo,motivo){
  var candidatos=candidatoAvoUnicoPorCodigo(cruces);
  if(!candidatos.length) return [];
  var origenes=candidatos.filter(function(p){
    var rol=indiceCatalogo.avoRoles[p.codigo];
    return rol&&rol.origin;
  });
  var salidas=candidatos.filter(function(p){
    var rol=indiceCatalogo.avoRoles[p.codigo];
    return rol&&rol.destination;
  });
  var detalle=[];
  if(origenes.length)
    detalle.push("Entradas candidatas: "+origenes.map(descripcionCandidatoAvo).join(", "));
  else detalle.push("Entrada no detectada");
  if(salidas.length)
    detalle.push("Salidas candidatas: "+salidas.map(descripcionCandidatoAvo).join(", "));
  else detalle.push("Salida no detectada");

  diagnosticoDeteccion.ambiguos.push({
    route_id:"route_americo_vespucio_oriente_avo_i",
    motivo:"avo_"+motivo,
    tramo:tramo,
    candidatos:candidatos.map(function(p){return p.codigo;})
  });

  return [{
    catalogo:true,esViajeAvo:true,esAvoAmbiguo:true,
    route_id:"route_americo_vespucio_oriente_avo_i",
    codigo:candidatos.map(function(p){return p.codigo;}).join(" / "),
    nombre:"AVO I · recorrido sin pareja validada",
    operador:"AVO I",ruta:"Américo Vespucio Oriente (AVO I)",
    lat:candidatos[0].lat,lon:candidatos[0].lon,
    tramo:tramo,posicion:candidatos[0].posicion,
    filasTarifa:[],direccion:"",
    avoMotivo:motivo,avoDetalle:detalle.join(" · "),
    avoCandidatos:candidatos
  }];
}
function cobroAvoP110(cruces,tramo){
  var p110=cruces.find(function(p){return p.codigo==="P110";});
  if(!p110) return [];
  var viaje=indiceCatalogo.viajes[
    p110.route_id+"|P110|P110"
  ];
  if(!viaje) return crearAvoAmbiguo([p110],tramo,"p110_sin_tarifa");
  var filas=indiceCatalogo.tarifasViaje[viaje.journey_id]||[];
  return [{
    catalogo:true,esViajeAvo:true,esAvoP110:true,
    journey_id:viaje.journey_id,route_id:p110.route_id,codigo:"P110",
    nombre:"AVO I · La Pirámide",
    operador:"AVO I",ruta:"Américo Vespucio Oriente (AVO I)",
    lat:p110.lat,lon:p110.lon,tramo:tramo,posicion:p110.posicion,
    filasTarifa:filas,direccion:viaje.direction||"Área 2 La Pirámide",
    entrada:p110,salida:p110,
    avoDetalle:"Cobro independiente P110 · par oficial P110→P110"
  }];
}
function cobrosAvoPorTramo(cruces,tramo){
  if(!indiceCatalogo||!cruces.length) return [];

  var independiente=cobroAvoP110(cruces,tramo);
  var candidatos=candidatoAvoUnicoPorCodigo(cruces);
  if(!candidatos.length) return independiente;

  var pares=[];
  for(var i=0;i<candidatos.length;i++){
    var a=candidatos[i];
    var rolA=indiceCatalogo.avoRoles[a.codigo];
    if(!rolA||!rolA.origin) continue;

    for(var j=i+1;j<candidatos.length;j++){
      var b=candidatos[j];
      var rolB=indiceCatalogo.avoRoles[b.codigo];
      if(!rolB||!rolB.destination) continue;

      var separacion=b.progresoRutaM-a.progresoRutaM;
      if(separacion<120) continue;

      var viaje=indiceCatalogo.viajes[
        a.route_id+"|"+a.codigo+"|"+b.codigo
      ];
      if(!viaje) continue;

      var score=(Number(a.puntajeDeteccion)||0)+
        (Number(b.puntajeDeteccion)||0)+
        Math.min(0.20,separacion/10000);
      pares.push({
        entrada:a,salida:b,viaje:viaje,
        separacion:separacion,score:score
      });
    }
  }

  if(!pares.length){
    return independiente.concat(
      crearAvoAmbiguo(candidatos,tramo,
        candidatos.length===1?"solo_un_extremo":"sin_par_oficial_ordenado")
    );
  }

  pares.sort(function(x,y){
    if(y.score!==x.score) return y.score-x.score;
    return y.separacion-x.separacion;
  });

  var mejor=pares[0];
  var segundo=pares[1];
  if(segundo&&Math.abs(mejor.score-segundo.score)<0.04&&
     (segundo.entrada.codigo!==mejor.entrada.codigo||
      segundo.salida.codigo!==mejor.salida.codigo)){
    return independiente.concat(
      crearAvoAmbiguo(candidatos,tramo,"multiples_pares_similares")
    );
  }

  var filas=indiceCatalogo.tarifasViaje[mejor.viaje.journey_id]||[];
  return independiente.concat([{
    catalogo:true,esViajeAvo:true,avoValidado:true,
    journey_id:mejor.viaje.journey_id,
    route_id:mejor.entrada.route_id,
    codigo:mejor.entrada.codigo+"→"+mejor.salida.codigo,
    nombre:"AVO I · "+mejor.viaje.origin_name+" → "+
      mejor.viaje.destination_name,
    operador:"AVO I",ruta:"Américo Vespucio Oriente (AVO I)",
    lat:(mejor.entrada.lat+mejor.salida.lat)/2,
    lon:(mejor.entrada.lon+mejor.salida.lon)/2,
    tramo:tramo,
    posicion:(mejor.entrada.posicion+mejor.salida.posicion)/2,
    filasTarifa:filas,direccion:mejor.viaje.direction||"",
    entrada:mejor.entrada,salida:mejor.salida,
    separacionDetectadaM:mejor.separacion,
    avoDetalle:"Entrada "+descripcionCandidatoAvo(mejor.entrada)+
      " · Salida "+descripcionCandidatoAvo(mejor.salida)+
      " · par oficial validado"
  }]);
}
function detectarPeajesCatalogo(geometrias){
  if(!indiceCatalogo) return [];
  diagnosticoDeteccion={descartados:[],aceptados:[],ambiguos:[]};
  var porTramo=[];

  geometrias.forEach(function(geo,ti){
    var comunes=[],avo=[];
    if(!geo||geo.length<2){
      porTramo[ti]={comunes:comunes,avo:avo};
      return;
    }

    indiceCatalogo.puntos.forEach(function(p){
      var cerca=puntoMasCercano(
        [Number(p.latitude),Number(p.longitude)],geo
      );
      var evaluacion=evaluarCandidatoPunto(p,cerca,geo);
      if(!evaluacion.aceptado){
        diagnosticoDeteccion.descartados.push({
          point_id:p.point_id,route_id:p.route_id,codigo:p.code||"",
          motivo:evaluacion.motivo,distancia:evaluacion.distancia,
          direccion:evaluacion.direccion,
          direccionScore:evaluacion.direccionScore,
          puntaje:evaluacion.puntaje
        });
        return;
      }

      var cobro=crearCobroPunto(p,ti,cerca,geo,evaluacion);
      if(p.route_id==="route_americo_vespucio_oriente_avo_i")
        avo.push(cobro);
      else
        comunes.push(cobro);

      diagnosticoDeteccion.aceptados.push({
        point_id:p.point_id,route_id:p.route_id,codigo:p.code||"",
        confianza:evaluacion.confianza,puntaje:evaluacion.puntaje
      });
    });

    comunes.sort(function(a,b){return a.posicion-b.posicion;});
    comunes=seleccionarMejorPorCruce(comunes);
    comunes=depurarCrucesSinDireccion(comunes);
    avo.sort(function(a,b){return a.progresoRutaM-b.progresoRutaM;});
    porTramo[ti]={comunes:comunes,avo:avo};
  });

  var salida=[];
  porTramo.forEach(function(grupo,ti){
    var porRuta={};
    grupo.comunes.forEach(function(p){
      if(!porRuta[p.route_id]) porRuta[p.route_id]=[];
      porRuta[p.route_id].push(p);
    });
    Object.keys(porRuta).forEach(function(rid){
      salida=salida.concat(porRuta[rid]);
    });
    salida=salida.concat(cobrosAvoPorTramo(grupo.avo,ti));
  });

  return salida.sort(function(a,b){
    return a.tramo-b.tramo||a.posicion-b.posicion;
  });
}

/* ============================================================
   Cálculo
   ============================================================ */
function longitudGeometriaMetros(geo){
  var total=0;
  for(var i=1;i<(geo||[]).length;i++) total+=haversine(geo[i-1],geo[i]);
  return total;
}
function minutoPasoPeaje(p,tramoIndex,salidaTramo){
  if(!circuito) return salidaTramo;
  var geo=circuito.legGeometrias[tramoIndex]||[];
  var totalM=longitudGeometriaMetros(geo);
  var duracion=Number(circuito.legs[tramoIndex])||0;
  var progreso=null;
  if(p&&p.esViajeAvo&&p.entrada&&isFinite(Number(p.entrada.progresoRutaM)))
    progreso=Number(p.entrada.progresoRutaM);
  else if(p&&isFinite(Number(p.progresoRutaM)))
    progreso=Number(p.progresoRutaM);
  if(progreso===null&&p&&isFinite(Number(p.posicion))&&geo.length>1)
    progreso=(Number(p.posicion)/(geo.length-1))*totalM;
  if(!(totalM>0)||progreso===null) return salidaTramo;
  var fraccion=Math.max(0,Math.min(1,progreso/totalM));
  return salidaTramo+duracion*fraccion;
}
function tramoPeajes(tramoIndex,minutos,sentido){
  var fecha=fechaElegida(),lineas=[],total=0,sinValor=0,avoAmbiguos=0;
  (circuito?circuito.peajes:[]).forEach(function(p){
    if(p.tramo!==tramoIndex) return;

    if(p.esAvoAmbiguo){
      sinValor++;
      avoAmbiguos++;
      lineas.push({
        nombre:p.nombre,
        ruta:p.avoDetalle+" · cobro AVO no aplicado",
        rutaNombre:"Américo Vespucio Oriente (AVO I)",
        tipoTarifa:"Pareja entrada–salida pendiente",
        direccion:"",esAvo:true,
        punta:false,monto:0,verificado:false,manual:false,
        avoAmbiguo:true
      });
      return;
    }

    var filas=p.esViajeAvo?p.filasTarifa:filasTarifaPunto(p);
    var minutoPaso=minutoPasoPeaje(p,tramoIndex,minutos);
    var ev=elegirTarifaFilas(
      filas,fecha,minutoPaso,p.route_id,sentido,p
    );
    if(ev){
      total+=ev.monto;
      var detalle=p.esViajeAvo
        ? p.avoDetalle
        : p.ruta+" · "+ev.tipo+
          (p.direccion?" · "+p.direccion:"")+
          (p.confianzaDeteccion
            ?" · detección "+p.confianzaDeteccion:"");
      if(p.esViajeAvo) detalle+=" · "+ev.tipo;
      if(ev.horarioEstimado) detalle+=" · horario estimado";

      lineas.push({
        nombre:p.nombre,ruta:detalle,punta:ev.punta,
        rutaNombre:p.ruta||"",tipoTarifa:ev.tipo||"Tarifa aplicada",
        direccion:p.direccion||"",esAvo:!!p.esViajeAvo,
        monto:ev.monto,verificado:true,manual:false,
        horaPaso:reloj(minutoPaso),minutoPaso:minutoPaso,
        horarioEstimado:ev.horarioEstimado,
        horarioFuente:ev.horarioFuente,
        diaTarifario:ev.diaTarifario,
        reglaDetalle:ev.reglaDetalle,
        reglaHorariaOficial:ev.horarioFuente==="oficial_portico"||ev.horarioFuente==="oficial",
        avoValidado:!!p.avoValidado
      });
    }else{
      sinValor++;
      lineas.push({
        nombre:p.nombre,
        ruta:(p.esViajeAvo
          ? (p.avoDetalle+" · tarifa AVO ausente")
          : (p.ruta+" · tarifa ausente en el catálogo")),
        rutaNombre:p.ruta||"",tipoTarifa:"Tarifa pendiente",
        direccion:p.direccion||"",esAvo:!!p.esViajeAvo,
        punta:false,monto:0,verificado:false,manual:false
      });
    }
  });
  return {
    lineas:lineas,total:total,sinValor:sinValor,sentido:sentido,
    avoAmbiguos:avoAmbiguos,
    horariosEstimados:lineas.filter(function(x){
      return x.horarioEstimado;
    }).length
  };
}

function calcular(){
  if(!circuito||!paradas.length) return null;
  var ag=agenda();
  var cobros=ag.tramos.map(function(t){
    return tramoPeajes(t.indice,t.salida,t.sentido);
  });
  var peajes=cobros.reduce(function(s,t){ return s+t.total; },0);
  var sinValor=cobros.reduce(function(s,t){ return s+t.sinValor; },0);
  var horariosEstimados=cobros.reduce(function(s,t){ return s+(t.horariosEstimados||0); },0);
  var avoAmbiguos=cobros.reduce(function(s,t){ return s+(t.avoAmbiguos||0); },0);

  var km=circuito.km, minutos=circuito.min;
  var rend=num("rendimiento")||1;
  var litros=km/rend;
  var bencina=litros*num("precioL");
  var desgaste=km*num("desgaste");
  var traslado=bencina+peajes+desgaste;

  var props=paradas.filter(function(p){ return tipoParada(p)==="propiedad"; }).length;
  var tecnicas=paradas.filter(function(p){ return tipoParada(p)==="tecnica"; }).length;
  var minutosTecnicos=paradas.reduce(function(s,p){
    return s+(tipoParada(p)==="tecnica"?duracionParada(p):0);
  },0);
  var minutosTrabajo=props*(num("minSitio")+num("postproduccion"));
  var horasTotales=(minutos+minutosTecnicos+minutosTrabajo)/60;
  var costoTiempoTotal=horasTotales*num("valorHora");
  var tar=num("tarifa");
  var ingresos=props*tar;
  var totalDia=ingresos-traslado-costoTiempoTotal;
  var trasUnit=props?traslado/props:0;
  var horasProp=props?horasTotales/props:0;
  var costoTiempo=props?costoTiempoTotal/props:0;
  var neto=props?totalDia/props:0;

  return {tramosCobro:cobros,ida:cobros[0],
          vuelta:ag.regresaBase?cobros[cobros.length-1]:null,
          agenda:ag,km:km,minutos:minutos,litros:litros,bencina:bencina,
          desgaste:desgaste,peajes:peajes,traslado:traslado,props:props,
          tecnicas:tecnicas,minutosTecnicos:minutosTecnicos,
          trasUnit:trasUnit,horasProp:horasProp,costoTiempo:costoTiempo,
          costoTiempoTotal:costoTiempoTotal,tarifa:tar,ingresos:ingresos,
          neto:neto,margen:tar>0&&props?neto/tar:0,sinValor:sinValor,
          horariosEstimados:horariosEstimados,avoAmbiguos:avoAmbiguos,
          crucesAmbiguos:diagnosticoDeteccion.ambiguos.length,totalDia:totalDia,
          regresaBase:ag.regresaBase,catalogoCargado:!!indiceCatalogo};
}

/* ============================================================
   Mapa
   ============================================================ */
function iniciarMapa(){
  if(mapa||typeof L==="undefined") return;
  $("mapa").classList.add("activo");
  $("mapaEspera").classList.add("oculto");
  mapa=L.map("mapa",{scrollWheelZoom:false});
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    maxZoom:19
  }).addTo(mapa);
  capaRuta=L.layerGroup().addTo(mapa);
  capaPuntos=L.layerGroup().addTo(mapa);
  mapa.on("click",function(){ mapa.scrollWheelZoom.enable(); });
  mapa.on("mouseout",function(){ mapa.scrollWheelZoom.disable(); });
}

function dibujarMapa(){
  iniciarMapa();
  if(!mapa||!circuito) return;
  capaRuta.clearLayers(); capaPuntos.clearLayers();

  L.polyline(circuito.geometria,{color:"#FFFFFF",weight:9,opacity:.9}).addTo(capaRuta);
  L.polyline(circuito.geometria,{color:"#2F5D6B",weight:5,opacity:.95,lineCap:"round"}).addTo(capaRuta);

  circuito.peajes.forEach(function(p){
    var agActual=agenda();
    var tramoActual=agActual&&agActual.tramos[p.tramo];

    function marcadorAvo(extremo,clase,letra,titulo,detalle){
      var icono=L.divIcon({
        className:"",
        html:'<div class="avo-extremo '+clase+'">'+letra+"</div>",
        iconSize:[24,24],iconAnchor:[12,12]
      });
      L.marker([extremo.lat,extremo.lon],{icon:icono})
        .bindPopup(
          '<b class="rotulo">'+esc(titulo)+"</b>"+
          esc(descripcionCandidatoAvo(extremo))+
          '<div style="margin-top:5px;color:#8A8580;font-size:12px">'+
          esc(detalle)+"</div>"
        ).addTo(capaPuntos);
    }

    if(p.esViajeAvo){
      if(p.esAvoAmbiguo){
        (p.avoCandidatos||[]).forEach(function(candidato){
          marcadorAvo(
            candidato,"ambiguo","?",
            "AVO I · extremo candidato",
            "No existe una pareja entrada–salida única. No se aplicó cobro."
          );
        });
      }else if(p.entrada&&p.salida){
        marcadorAvo(
          p.entrada,"entrada","E",
          p.esAvoP110?"AVO I · P110":"AVO I · entrada detectada",
          p.avoDetalle
        );
        if(!p.esAvoP110||p.salida.point_id!==p.entrada.point_id){
          marcadorAvo(
            p.salida,"salida","S",
            "AVO I · salida detectada",
            p.avoDetalle
          );
        }
      }
      return;
    }

    var filas=filasTarifaPunto(p);
    var minutoPasoMapa=tramoActual
      ? minutoPasoPeaje(p,p.tramo,tramoActual.salida)
      : minutosDe(horaSalida);
    var ev=elegirTarifaFilas(
      filas,fechaElegida(),minutoPasoMapa,
      p.route_id,tramoActual?tramoActual.sentido:"oriente",p
    );
    var ic=L.divIcon({
      className:"",
      html:'<div class="peaje-icono'+(ev?"":" sinvalor")+'"></div>',
      iconSize:[15,15],iconAnchor:[7,7]
    });
    var det=p.ruta+
      (p.direccion?" · "+esc(p.direccion):"")+"<br>"+
      (ev?(esc(ev.tipo)+" "+pesos(ev.monto)+" · paso "+reloj(minutoPasoMapa)+
        (ev.reglaDetalle?" · "+esc(ev.reglaDetalle):"")):
        "Tarifa ausente en el catálogo")+
      "<br>Detección "+esc(p.confianzaDeteccion||"sin clasificar")+
      " · "+Math.round(Number(p.distanciaRuta)||0)+" m"+
      (p.reglaSeleccionCruce
        ?" · "+esc(p.reglaSeleccionCruce):"");
    L.marker([p.lat,p.lon],{icon:ic})
      .bindPopup(
        '<b class="rotulo">Catálogo MOP/manual</b>'+esc(p.nombre)+
        '<div style="margin-top:5px;color:#8A8580;font-size:12px">'+
        det+"</div>"
      ).addTo(capaPuntos);
  });

  var ag=agenda();
  paradas.forEach(function(p,i){
    var ic=L.divIcon({className:"",
      html:'<div class="marcador" style="width:22px;height:22px;background:#D18A2C;'+
        'display:flex;align-items:center;justify-content:center;color:#141311;'+
        "font:600 11px/1 'IBM Plex Mono',monospace\">"+(i+1)+"</div>",
      iconSize:[22,22],iconAnchor:[11,11]});
    L.marker([p.lat,p.lon],{icon:ic})
      .bindPopup('<b class="rotulo">Parada '+(i+1)+"</b>"+esc(p.etiqueta)+
        (ag?'<div style="margin-top:5px;color:#8A8580;font-size:12px">Llegas '+
             reloj(ag.filas[i].llegada)+" · sales "+reloj(ag.filas[i].salida)+"</div>":""))
      .addTo(capaPuntos);
  });

  var ib=L.divIcon({className:"",
    html:'<div class="marcador" style="width:14px;height:14px;background:#141311"></div>',
    iconSize:[14,14],iconAnchor:[7,7]});
  L.marker([base.lat,base.lon],{icon:ib})
    .bindPopup('<b class="rotulo">Base</b>'+esc(base.etiqueta)).addTo(capaPuntos);

  if(modoFin==="otra"&&destinoFinal){
    var ifin=L.divIcon({className:"",
      html:'<div class="marcador" style="width:20px;height:20px;background:#7A4A2E;'+
        'border-radius:2px;display:flex;align-items:center;justify-content:center;'+
        "color:#fff;font:600 11px/1 IBM Plex Mono,monospace\">◆</div>",
      iconSize:[20,20],iconAnchor:[10,10]});
    L.marker([destinoFinal.lat,destinoFinal.lon],{icon:ifin})
      .bindPopup('<b class="rotulo">Destino final</b>'+esc(destinoFinal.etiqueta))
      .addTo(capaPuntos);
  }

  var lim=circuito.geometria.slice();
  lim.push([base.lat,base.lon]);
  if(modoFin==="otra"&&destinoFinal)
    lim.push([destinoFinal.lat,destinoFinal.lon]);
  mapa.fitBounds(L.latLngBounds(lim),{padding:[26,26]});
}

/* ============================================================
   Render
   ============================================================ */
function confirmarSelectorHora(){
  if(!selectorHoraAbierto) return;
  var hh=$("hora24Horas"),mm=$("hora24Minutos"),fd=$("fecha24Input");
  if(hh&&mm) horaPendiente=hh.value+":"+mm.value;
  if(fd&&fechaIsoValida(fd.value)) fechaPendiente=fd.value;
  if(!hora24Valida(horaPendiente)) horaPendiente=horaSalida;
  if(!fechaIsoValida(fechaPendiente)) fechaPendiente=$("fecha").value;
  horaSalida=horaPendiente;
  if(fechaIsoValida(fechaPendiente)) $("fecha").value=fechaPendiente;
  selectorHoraAbierto=false;
  render();
  guardar();
}

function renderAtajos(){
  var c=$("atajos"); c.innerHTML="";
  ATAJOS.forEach(function(a){
    var b=document.createElement("button");
    b.type="button"; b.className="atajo";
    b.innerHTML="<b>"+esc(a.etiqueta)+"</b>";
    b.addEventListener("click",function(){ $("direccion").value=a.texto; $("btnBuscar").click(); });
    c.appendChild(b);
  });
}

function renderParadas(){
  normalizarParadas();
  var ul=$("paradas"); ul.innerHTML="";
  if(!paradas.length){
    $("barraOrden").innerHTML="";
    actualizarPanelFin();
    return;
  }
  var ag=agenda();

  var liBase=document.createElement("li");
  liBase.className="parada base";
  liBase.innerHTML='<span class="orden">◇</span>'+
    '<span class="texto">Base<small>'+esc(base?base.etiqueta:"")+"</small></span>"+
    '<span class="reloj hora24-wrap" id="hora24Wrap">'+
      '<span class="salida-botones">'+
        '<span class="salida-control">'+
          '<button type="button" class="fecha24-trigger" id="fechaSalidaBtn" aria-expanded="false">'+
            esc(etiquetaFechaSalida($("fecha").value))+'</button>'+
          '<small>día / fecha</small>'+
        '</span>'+
        '<span class="salida-control">'+
          '<button type="button" class="hora24-trigger" id="horaSalidaBtn" aria-expanded="false">'+esc(horaSalida)+'</button>'+
          '<small>hora · 24 h</small>'+
        '</span>'+
      '</span>'+
      '<div class="hora24-panel" id="hora24Panel" hidden>'+
        '<div class="hora24-titulo">Fecha y hora de salida</div>'+
        '<div class="fecha24-campo"><label for="fecha24Input">Fecha</label>'+
          '<input type="date" id="fecha24Input"></div>'+
        '<div class="hora24-controles">'+
          '<select id="hora24Horas" aria-label="Hora"></select>'+
          '<span class="hora24-dos-puntos">:</span>'+
          '<select id="hora24Minutos" aria-label="Minutos"></select>'+
        '</div>'+
        '<div class="hora24-acciones">'+
          '<button type="button" class="aplicar" id="hora24Aplicar">Confirmar</button>'+
          '<button type="button" id="hora24Cancelar">Cancelar</button></div>'+
      '</div>'+
    '</span>';
  ul.appendChild(liBase);

  var hh=$("hora24Horas"),mm=$("hora24Minutos"),fd=$("fecha24Input");
  for(var h24=0;h24<24;h24++){
    var oh=document.createElement("option");
    oh.value=String(h24).padStart(2,"0"); oh.textContent=oh.value; hh.appendChild(oh);
  }
  for(var m24=0;m24<60;m24++){
    var om=document.createElement("option");
    om.value=String(m24).padStart(2,"0"); om.textContent=om.value; mm.appendChild(om);
  }
  function cargarSalidaPendiente(){
    horaPendiente=hora24Valida(horaSalida)?horaSalida:"09:00";
    fechaPendiente=fechaIsoValida($("fecha").value)?$("fecha").value:"";
    var partesHora=horaPendiente.split(":");
    hh.value=partesHora[0]; mm.value=partesHora[1];
    fd.value=fechaPendiente;
  }
  function abrirSelectorSalida(){
    cargarSalidaPendiente();
    selectorHoraAbierto=true;
    $("hora24Panel").hidden=false;
    $("horaSalidaBtn").setAttribute("aria-expanded","true");
    $("fechaSalidaBtn").setAttribute("aria-expanded","true");
  }
  [$("horaSalidaBtn"),$("fechaSalidaBtn")].forEach(function(btn){
    btn.addEventListener("click",function(e){
      e.stopPropagation();
      if(selectorHoraAbierto) confirmarSelectorHora();
      else abrirSelectorSalida();
    });
  });
  [hh,mm].forEach(function(sel){
    sel.addEventListener("change",function(){
      horaPendiente=hh.value+":"+mm.value;
    });
  });
  fd.addEventListener("change",function(){
    if(fechaIsoValida(fd.value)) fechaPendiente=fd.value;
  });
  $("hora24Aplicar").addEventListener("click",function(){ confirmarSelectorHora(); });
  $("hora24Cancelar").addEventListener("click",function(){
    selectorHoraAbierto=false;
    $("hora24Panel").hidden=true;
    $("horaSalidaBtn").setAttribute("aria-expanded","false");
    $("fechaSalidaBtn").setAttribute("aria-expanded","false");
  });

  paradas.forEach(function(p,i){
    var tipo=tipoParada(p),fila=ag&&ag.filas[i];
    var li=document.createElement("li");
    li.className="parada "+tipo;
    var horario=fila
      ? reloj(fila.llegada)+"<small>sales "+reloj(fila.salida)+"</small>"
      :"";

    var botonesTipo=
      '<span class="tipo-parada" data-indice="'+i+'">'+
        '<button type="button" data-tipo="propiedad" class="'+(tipo==="propiedad"?"activo":"")+'">Propiedad</button>'+
        '<button type="button" data-tipo="tecnica" class="'+(tipo==="tecnica"?"activo":"")+'">Técnica</button>'+
        (tipo==="tecnica"
          ? '<label class="duracion-tecnica">Duración <input type="number" min="0" step="5" '+
            'value="'+(isFinite(Number(p.minutosTecnicos))?Number(p.minutosTecnicos):15)+
            '" data-minutos-tecnicos="'+i+'"> min</label>'
          :"")+
      "</span>";

    li.innerHTML='<span class="orden">'+(i+1)+"</span>"+
      '<span class="mover">'+
        '<button type="button" data-sube="'+i+'"'+(i===0?" disabled":"")+">▲</button>"+
        '<button type="button" data-baja="'+i+'"'+(i===paradas.length-1?" disabled":"")+'>▼</button>'+
      "</span>"+
      '<span class="texto">'+esc(p.etiqueta.split(",")[0])+
        "<small>"+esc(p.etiqueta.split(",").slice(1).join(",").trim())+"</small>"+
        '<span class="tipo-resumen">'+esc(etiquetaTipoParada(p))+
          (tipo==="tecnica"?" · "+
            (isFinite(Number(p.minutosTecnicos))?Number(p.minutosTecnicos):15)+" min":"")+
        "</span>"+botonesTipo+"</span>"+
      '<span class="reloj">'+horario+"</span>"+
      '<button type="button" class="quitar" data-quita="'+i+'" aria-label="Quitar">×</button>';
    ul.appendChild(li);
  });

  if(ag&&ag.regresaBase){
    var liRegreso=document.createElement("li");
    liRegreso.className="parada base";
    liRegreso.innerHTML='<span class="orden">◆</span>'+
      '<span class="texto">Vuelta a la base</span>'+
      '<span class="reloj">'+reloj(ag.regreso)+"<small>llegada estimada</small></span>";
    ul.appendChild(liRegreso);
  }else if(ag&&modoFin==="otra"&&destinoFinal&&ag.llegadaFinal!==null){
    var liDestino=document.createElement("li");
    liDestino.className="parada destino-final";
    liDestino.innerHTML='<span class="orden">◆</span>'+
      '<span class="texto">Destino final<small>'+esc(destinoFinal.etiqueta)+"</small></span>"+
      '<span class="reloj">'+reloj(ag.llegadaFinal)+"<small>fin del recorrido</small></span>";
    ul.appendChild(liDestino);
  }

  ul.querySelectorAll("[data-sube]").forEach(function(b){
    b.addEventListener("click",function(){
      var i=parseInt(b.getAttribute("data-sube"),10);
      var t=paradas[i-1]; paradas[i-1]=paradas[i]; paradas[i]=t;
      recalcular(false);
    });
  });
  ul.querySelectorAll("[data-baja]").forEach(function(b){
    b.addEventListener("click",function(){
      var i=parseInt(b.getAttribute("data-baja"),10);
      var t=paradas[i+1]; paradas[i+1]=paradas[i]; paradas[i]=t;
      recalcular(false);
    });
  });
  ul.querySelectorAll(".tipo-parada button[data-tipo]").forEach(function(b){
    b.addEventListener("click",function(){
      var cont=b.closest(".tipo-parada");
      cambiarTipoParada(parseInt(cont.getAttribute("data-indice"),10),
                        b.getAttribute("data-tipo"));
    });
  });
  ul.querySelectorAll("[data-minutos-tecnicos]").forEach(function(input){
    input.addEventListener("change",function(){
      var i=parseInt(input.getAttribute("data-minutos-tecnicos"),10);
      paradas[i].minutosTecnicos=Math.max(0,Number(input.value)||0);
      render(); guardar();
    });
  });
  ul.querySelectorAll("[data-quita]").forEach(function(b){
    b.addEventListener("click",function(){
      paradas.splice(parseInt(b.getAttribute("data-quita"),10),1);
      if(!paradas.length){
        circuito=null; comparacion=null; render(); guardar(); return;
      }
      recalcular(false);
    });
  });

  var barra=$("barraOrden");
  barra.innerHTML="";
  if(paradas.length>=2){
    var btn=document.createElement("button");
    btn.type="button"; btn.className="btn suave"; btn.id="btnOptimizar";
    btn.textContent=modoFin==="base"
      ?"Optimizar circuito"
      :"Optimizar manteniendo el final";
    btn.disabled=cantidadParadasOptimizables()<2;
    btn.addEventListener("click",function(){ recalcular(true); });
    barra.appendChild(btn);

    var caja=document.createElement("div");
    if(comparacion&&circuito){
      var ahorroKm=comparacion.km-circuito.km;
      var ahorroMin=comparacion.min-circuito.min;
      caja.className="ahorro"+(ahorroKm>.1||ahorroMin>1?"":" nulo");
      caja.innerHTML=ahorroKm>.1||ahorroMin>1
        ? "<b>Orden optimizado:</b> ahorra "+coma(Math.max(0,ahorroKm))+
          " km y "+Math.round(Math.max(0,ahorroMin))+" min."
        : "<b>Este orden ya es conveniente.</b>";
    }else{
      caja.className="ahorro nulo";
      caja.textContent=modoFin==="base"
        ?"El optimizador puede reordenar todas las paradas."
        :"El punto final se mantiene fijo; solo se reordenan las visitas anteriores.";
    }
    barra.appendChild(caja);
  }
  actualizarPanelFin();
}

function textoModoFin(){
  if(modoFin==="ultima") return paradas.length
    ?"El recorrido terminará en la última parada de la lista."
    :"Agrega una parada para usar esta opción.";
  if(modoFin==="otra") return destinoFinal
    ?"El recorrido terminará en "+destinoFinal.etiqueta+"."
    :"Falta fijar la dirección final.";
  return "El recorrido volverá a la base.";
}
function actualizarPanelFin(){
  modoFin=modoFinValido(modoFin);
  document.querySelectorAll("[data-modo-fin]").forEach(function(b){
    var activo=b.getAttribute("data-modo-fin")===modoFin;
    b.classList.toggle("activo",activo);
    b.setAttribute("aria-pressed",activo?"true":"false");
  });
  var campos=$("finOtraCampos");
  if(campos) campos.hidden=modoFin!=="otra";
  var estadoFin=$("finEstado");
  if(estadoFin){
    estadoFin.textContent=textoModoFin();
    estadoFin.className="fin-estado"+
      ((modoFin==="ultima"&&!paradas.length)||(modoFin==="otra"&&!destinoFinal)
        ?" error":"");
  }
  if($("finActual")){
    $("finActual").textContent=destinoFinal
      ?"Destino guardado: "+destinoFinal.etiqueta
      :"Todavía no has fijado la dirección final.";
  }
  if($("btnQuitarFin")) $("btnQuitarFin").disabled=!destinoFinal;
}
function cambiarModoFin(nuevoModo){
  modoFin=modoFinValido(nuevoModo);
  actualizarPanelFin();
  guardar();
  if(!base||!paradas.length){
    circuito=null; render(); return;
  }
  if(modoFin==="otra"&&!destinoFinal){
    circuito=null; comparacion=null; render();
    avisar("Ingresa la dirección donde termina el recorrido.",false);
    $("dirFin").focus();
    return;
  }
  recalcular(false);
}
async function fijarDestinoFinal(item){
  destinoFinal={
    lat:parseFloat(item.lat),lon:parseFloat(item.lon),
    etiqueta:item.display_name.split(", ").slice(0,3).join(", ")
  };
  modoFin="otra";
  $("dirFin").value="";
  actualizarPanelFin();
  guardar();
  if(base&&paradas.length) await recalcular(false);
}
function quitarDestinoFinal(){
  destinoFinal=null;
  actualizarPanelFin();
  guardar();
  if(modoFin==="otra"){
    circuito=null; comparacion=null; render();
    avisar("La dirección final fue eliminada. Fija otra o selecciona otro final.",false);
  }
}

function renderTramo(titulo,d,color,minutos,etiquetaHora){
  var sentido={poniente:"hacia poniente",oriente:"hacia oriente",
               norte:"hacia el norte",sur:"hacia el sur"}[d.sentido]||d.sentido;
  var filas=d.lineas.map(function(l){
    var tipo=l.tipoTarifa||"";
    var metadata=[];
    if(l.rutaNombre) metadata.push(l.rutaNombre);
    if(l.direccion) metadata.push(l.direccion);
    if(l.horaPaso){
      var etiquetaDia={laboral:"día laboral",sabado:"sábado",domingo:"domingo",festivo:"festivo"}[l.diaTarifario]||l.diaTarifario||"";
      metadata.push("paso estimado "+l.horaPaso+
        (etiquetaDia?" · "+etiquetaDia:"")+
        (l.reglaHorariaOficial?" · horario oficial":""));
      if(l.reglaDetalle) metadata.push("franja "+l.reglaDetalle);
    }
    if(!metadata.length&&l.ruta) metadata.push(l.ruta);

    var derecha='<span class="valor-tarifa"><span class="valor">'+
      (l.verificado?pesos(l.monto):"—")+'</span>'+
      '<span class="estado-tarifa'+(l.verificado?'':' pendiente')+'">'+
      (l.verificado?'Incluido en total':'No incluido')+'</span></span>';

    return "<li><span class='nombre"+(l.verificado?"":" sin-verificar")+"'>"+esc(l.nombre)+
      (tipo?'<span class="tipo-tarifa">'+esc(tipo)+"</span>":"")+
      (l.punta?'<span class="etiqueta-punta">punta</span>':"")+
      "<small>"+esc(metadata.join(" · "))+
      (l.horarioEstimado?" · horario estimado":"")+
      (l.verificado?"":" · tarifa por confirmar")+"</small></span>"+
      derecha+"</li>";
  }).join("");
  if(!filas) filas=indiceCatalogo
    ? '<li><span class="nombre" style="color:var(--z5)">Sin peajes detectados en este tramo<small>El tarifario no aplica cobros a este segmento.</small></span><span class="valor-tarifa"><span class="valor">$0</span><span class="estado-tarifa">Sin cobro</span></span></li>'
    : '<li><span class="nombre sin-verificar">Peajes no evaluados<small>Los datos tarifarios no están disponibles.</small></span><span class="valor-tarifa"><span class="valor">—</span><span class="estado-tarifa pendiente">No incluido</span></span></li>';
  return '<div class="tramo"><div class="tramo-cabeza">'+
    '<span class="tramo-rotulo"><span class="punto-tramo" style="background:'+color+'"></span>'+
    titulo+'</span><span class="suma">'+pesos(d.total)+"</span></div>"+
    '<div class="tramo-hora"><span>'+etiquetaHora+" "+reloj(minutos)+" · "+sentido+"</span></div>"+
    '<ul class="peajes">'+filas+"</ul></div>";
}

function coordenadaGoogle(p){
  return Number(p.lat).toFixed(6)+","+Number(p.lon).toFixed(6);
}
function nodosRutaGoogle(){
  if(!base||!paradas.length||!finalRutaValido()) return [];
  var nodos=[base].concat(paradas);
  if(modoFin==="base") nodos.push(base);
  else if(modoFin==="otra"&&destinoFinal) nodos.push(destinoFinal);
  return nodos;
}
function urlGoogleMaps(nodos){
  if(!nodos||nodos.length<2) return "";
  var params=new URLSearchParams();
  params.set("api","1");
  params.set("origin",coordenadaGoogle(nodos[0]));
  params.set("destination",coordenadaGoogle(nodos[nodos.length-1]));
  params.set("travelmode","driving");
  params.set("dir_action","navigate");
  if(nodos.length>2){
    params.set("waypoints",
      nodos.slice(1,-1).map(coordenadaGoogle).join("|"));
  }
  return "https://www.google.com/maps/dir/?"+params.toString();
}
function dividirRutaGoogle(nodos,maxWaypoints){
  var maxNodos=(maxWaypoints||3)+2;
  var etapas=[],inicio=0,ultimo=nodos.length-1;
  while(inicio<ultimo){
    var fin=Math.min(inicio+maxNodos-1,ultimo);
    etapas.push(nodos.slice(inicio,fin+1));
    inicio=fin;
  }
  return etapas;
}
function abrirEtapaGoogle(indice){
  var etapa=googleMapsEtapas[indice];
  if(!etapa) return;
  var url=urlGoogleMaps(etapa);
  if(url) window.open(url,"_blank","noopener");
}
function prepararGoogleMaps(){
  var boton=$("btnGoogleMaps");
  var resumen=$("googleMapsResumen");
  var cont=$("googleMapsEtapas");
  googleMapsEtapas=[];
  cont.innerHTML="";
  cont.hidden=true;

  var nodos=nodosRutaGoogle();
  if(!circuito||nodos.length<2){
    boton.disabled=true;
    boton.textContent="Abrir ruta en Google Maps";
    resumen.textContent="Calcula una ruta para generar el enlace.";
    return;
  }

  var intermedios=Math.max(0,nodos.length-2);
  if(intermedios<=3){
    googleMapsEtapas=[nodos];
    boton.textContent="Abrir ruta en Google Maps";
    resumen.textContent=intermedios+
      (intermedios===1?" parada intermedia":" paradas intermedias")+
      " · enlace único";
  }else{
    googleMapsEtapas=dividirRutaGoogle(nodos,3);
    boton.textContent="Abrir etapa 1 de "+googleMapsEtapas.length;
    resumen.textContent=intermedios+
      " paradas intermedias · dividido para compatibilidad móvil";
    cont.hidden=false;
    googleMapsEtapas.forEach(function(etapa,i){
      var b=document.createElement("button");
      b.type="button";
      b.textContent="Etapa "+(i+1)+" de "+googleMapsEtapas.length;
      b.addEventListener("click",function(){ abrirEtapaGoogle(i); });
      cont.appendChild(b);
    });
  }
  boton.disabled=false;
}

function render(){
  renderParadas();
  var c=calcular();

  if(!c){
    $("valorNeto").textContent="—";
    $("resumenRuta").textContent="—";
    $("resumenPeajes").textContent="—";
    $("tramos").innerHTML="";
    $("alertaResultado").hidden=true;
    $("filaPeajesPendientes").hidden=true;
    [
      "vIngresoProp","vBencina","vPeajes","vDesgaste","vTraslado",
      "vTrasUnit","vTiempo","vGananciaOperacion","vIngresosDia",
      "vTrasladoDia","vTiempoDia","vDia"
    ].forEach(function(id){ $(id).textContent="$0"; });
    prepararGoogleMaps();
    return;
  }

  $("etiquetaDestino").textContent=
    c.props+(c.props===1?" propiedad":" propiedades")+
    (c.tecnicas?" · "+c.tecnicas+(c.tecnicas===1?" técnica":" técnicas"):"")+
    (modoFin==="base"?" · vuelve a base":
      (modoFin==="ultima"?" · termina en última":" · termina en otra dirección"));

  $("resumenRuta").textContent=
    coma(c.km)+" km · "+Math.round(c.minutos)+" min de manejo";
  var anoTarifario=indiceCatalogo&&indiceCatalogo.metadata&&
    indiceCatalogo.metadata.tariff_year||"—";
  var fSim=fechaElegida(),dias=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  $("resumenSimulacion").textContent="Simulación: "+dias[fSim.getDay()]+" "+
    String(fSim.getDate()).padStart(2,"0")+"/"+String(fSim.getMonth()+1).padStart(2,"0")+
    "/"+fSim.getFullYear()+" · salida "+horaSalida;
  $("resumenPeajes").textContent=c.catalogoCargado
    ? pesos(c.peajes)+" incluidos · tarifario "+anoTarifario+
      (c.sinValor?" · "+c.sinValor+" pendiente"+(c.sinValor===1?"":"s"):"")
    : "peajes sin calcular";

  $("tramos").innerHTML=c.agenda.tramos.map(function(t,i){
    var desde=t.desde===base
      ?"Base":nombreTramoParada(t.desde,paradas.indexOf(t.desde));
    var hacia=t.hacia===base
      ?"Base":nombreTramoParada(t.hacia,paradas.indexOf(t.hacia));
    var color=i===0?"var(--ida)":
      ((t.clase==="regreso"||t.clase==="destino_final")
        ?"var(--vuelta)":"var(--ambar)");
    return renderTramo(
      desde+" → "+hacia,c.tramosCobro[i],color,t.salida,"Sales a las"
    );
  }).join("");

  var provisional=!c.catalogoCargado||c.sinValor>0||
    c.avoAmbiguos>0||c.crucesAmbiguos>0||c.horariosEstimados>0;
  var prefijo=provisional?"≤ ":"";

  $("vIngresoProp").textContent=c.props?pesos(c.tarifa):"—";
  $("vTrasUnit").textContent=c.props?"− "+pesos(c.trasUnit):"—";
  $("vTiempo").textContent=c.props?"− "+pesos(c.costoTiempo):"—";
  $("valorNeto").textContent=c.props?prefijo+pesos(c.neto):"—";
  $("vGananciaOperacion").textContent=c.props?prefijo+pesos(c.neto):"—";

  $("vBencina").textContent=pesos(c.bencina);
  $("vPeajes").textContent=c.catalogoCargado?pesos(c.peajes):"—";
  $("vDesgaste").textContent=pesos(c.desgaste);
  $("vTraslado").textContent=c.catalogoCargado
    ? pesos(c.traslado)
    : "≥ "+pesos(c.bencina+c.desgaste);

  $("vIngresosDia").textContent=pesos(c.ingresos);
  $("vTrasladoDia").textContent="− "+pesos(c.traslado);
  $("vTiempoDia").textContent="− "+pesos(c.costoTiempoTotal);
  $("vDia").textContent=prefijo+pesos(c.totalDia);

  $("detLitros").textContent=
    coma(c.litros)+" L en "+Math.round(c.km)+" km";
  var confirmados=c.tramosCobro.reduce(function(n,t){
    return n+t.lineas.filter(function(l){return l.verificado;}).length;
  },0);
  $("detPeajes").textContent=c.catalogoCargado
    ? confirmados+" cobro"+(confirmados===1?"":"s")+" incluido"+(confirmados===1?"":"s")+
      " · tarifario "+anoTarifario+
      (c.sinValor?" · "+c.sinValor+" no incluido"+(c.sinValor===1?"":"s"):"")
    : "Datos tarifarios no disponibles";
  $("detReparto").textContent=c.props
    ?"repartido entre "+c.props+(c.props===1?" propiedad":" propiedades")
    :"sin propiedades trabajadas";
  $("detHoras").textContent=c.props
    ? coma(c.horasProp)+" h por propiedad"
    : coma(c.costoTiempoTotal/(num("valorHora")||1))+" h totales";
  $("detDia").textContent=c.props
    ? c.props+" propiedades · ingresos menos costos y tiempo"
    : "sin ingresos por propiedades";

  $("notaNeto").textContent=c.props
    ? (provisional
      ?"máximo estimado de los "+pesos(c.tarifa)+
        " que cobras; faltan datos por confirmar"
      :"de los "+pesos(c.tarifa)+
        " que cobras, después de traslado y valor de tu tiempo")
    :"El recorrido no contiene propiedades facturables.";

  var alerta=$("alertaResultado");
  if(provisional){
    var mensajes=[];
    if(!c.catalogoCargado) mensajes.push("el catálogo de peajes no está cargado");
    if(c.avoAmbiguos>0) mensajes.push(
      c.avoAmbiguos+" tramo"+(c.avoAmbiguos===1?"":"s")+" AVO I sin pareja validada"
    );
    if(c.sinValor>0) mensajes.push(
      c.sinValor+" cobro"+(c.sinValor===1?"":"s")+" sin valor"
    );
    if(c.crucesAmbiguos>0) mensajes.push(
      c.crucesAmbiguos+" cruce"+(c.crucesAmbiguos===1?"":"s")+" ambiguo"
    );
    if(c.horariosEstimados>0) mensajes.push(
      c.horariosEstimados+" horario"+(c.horariosEstimados===1?"":"s")+" estimado"
    );
    alerta.hidden=false;
    $("alertaTitulo").textContent="Resultado provisional";
    $("alertaDetalle").textContent=
      mensajes.join(" · ")+". La ganancia real puede ser inferior.";
  }else{
    alerta.hidden=true;
  }

  var pendientes=[];
  if(!c.catalogoCargado) pendientes.push("catálogo no cargado");
  if(c.sinValor>0) pendientes.push(c.sinValor+" sin tarifa");
  if(c.crucesAmbiguos>0) pendientes.push(c.crucesAmbiguos+" ambiguos");
  $("filaPeajesPendientes").hidden=pendientes.length===0;
  $("vPeajesPendientes").textContent=pendientes.join(" · ")||"—";

  var pct=Math.round(c.margen*100);
  var estadoMargen=pct<0?"Pérdida":(pct<30?"Margen ajustado":"Margen saludable");
  $("pctMargen").textContent=c.props?prefijo+pct+"%":"—";
  $("margenEstado").textContent=c.props
    ? estadoMargen+(provisional?" · máximo estimado":"")
    :"Margen no disponible";
  $("aguja").style.left=c.props
    ? Math.max(0,Math.min(100,((c.margen+0.5)/1.25)*100))+"%"
    : "25%";

  var v=$("veredicto");
  v.className="veredicto";
  var hayPunta=c.tramosCobro.some(function(t){
    return t.lineas.some(function(l){ return l.punta; });
  });
  var jornadaLarga=(c.agenda.fin-c.agenda.salidaBase)>10*60;

  if(c.props===0){
    v.innerHTML="<b>Recorrido sin propiedades trabajadas.</b> "+
      "Se muestran los costos de transporte y tiempo, pero no existe ingreso.";
  }else if(provisional){
    v.innerHTML="<b>Revisa los pendientes antes de aceptar esta cifra.</b> "+
      "Los costos confirmados ya están incluidos, pero el resultado se muestra "+
      "como un máximo porque faltan cobros o reglas por validar.";
  }else if(c.neto<0){
    v.classList.add("mal");
    v.innerHTML="<b>La jornada produce pérdida.</b> Para quedar en cero tendrías "+
      "que cobrar "+pesos(c.tarifa-c.neto)+" por propiedad.";
  }else if(jornadaLarga){
    v.innerHTML="<b>Jornada de "+
      coma((c.agenda.fin-c.agenda.salidaBase)/60)+" horas.</b> "+
      (modoFin==="base"
        ?"Vuelves a las "+reloj(c.agenda.regreso)+"."
        :"Terminas a las "+reloj(c.agenda.fin)+".");
  }else if(hayPunta){
    v.innerHTML="<b>El recorrido utiliza tarifa punta.</b> Cambiar la hora o el "+
      "orden puede reducir el costo.";
  }else if(c.margen<0.30){
    v.innerHTML="<b>Margen ajustado.</b> La ganancia estimada de la jornada es "+
      pesos(c.totalDia)+".";
  }else{
    v.classList.add("bien");
    v.innerHTML="<b>Margen saludable.</b> La jornada deja "+
      pesos(c.totalDia)+" después de traslado y valor de tu tiempo.";
  }

  prepararGoogleMaps();
  dibujarMapa();
}

/* ============================================================
   Ruteo
   ============================================================ */
async function recalcular(optimizar_orden){
  if(!base||!paradas.length) return;
  normalizarParadas();
  modoFin=modoFinValido(modoFin);

  if(!finalRutaValido()){
    circuito=null; comparacion=null; render();
    if(modoFin==="otra")
      avisar("Fija la dirección final antes de calcular la ruta.",false);
    else
      avisar("Agrega al menos una parada para terminar en la última.",false);
    return;
  }

  var puntos=puntosParaRuta();
  avisar(optimizar_orden?"Buscando el mejor orden…":
    (modoFin==="base"?"Recalculando el circuito…":"Recalculando la ruta con final fijo…"),false);
  $("btnBuscar").disabled=true;

  try{
    var fijo=await circuitoFijo(puntos,modoFin);
    var refKm=fijo.distance/1000,refMin=fijo.duration/60;
    var elegido=fijo,legs=fijo.legs.map(function(l){return l.duration/60;});

    if(optimizar_orden&&cantidadParadasOptimizables()>=2){
      var paradasAntes=paradas.slice();
      var trip=await optimizar(puntos,modoFin),t=trip.trips[0];

      var ultimoIndiceEntrada=puntos.length-1;
      var indicesMovibles=[];
      if(modoFin==="base"){
        for(var i=1;i<puntos.length;i++) indicesMovibles.push(i);
      }else if(modoFin==="ultima"){
        for(var j=1;j<ultimoIndiceEntrada;j++) indicesMovibles.push(j);
      }else{
        /* En modo "otra", el último punto es destinoFinal y todas las
           paradas intermedias pueden reordenarse. */
        for(var k=1;k<ultimoIndiceEntrada;k++) indicesMovibles.push(k);
      }

      indicesMovibles.sort(function(a,b){
        return trip.waypoints[a].waypoint_index-trip.waypoints[b].waypoint_index;
      });
      var ordenadas=indicesMovibles.map(function(indiceEntrada){
        return paradasAntes[indiceEntrada-1];
      });

      if(modoFin==="ultima"){
        ordenadas.push(paradasAntes[paradasAntes.length-1]);
      }
      paradas=ordenadas;
      elegido=t;
      legs=t.legs.map(function(l){return l.duration/60;});
    }

    circuito={
      km:elegido.distance/1000,
      min:elegido.duration/60,
      geometria:elegido.geometry.coordinates.map(function(c){return [c[1],c[0]];}),
      legs:legs,
      legGeometrias:geometriaLegs(elegido),
      peajes:[],
      modoFin:modoFin,
      regresaBase:modoFin==="base"
    };
    comparacion={km:refKm,min:refMin};
    render();
    avisar("",false);

    if(indiceCatalogo){
      estado("Comparando cada tramo con el catálogo MOP y las coordenadas manuales…");
      circuito.peajes=detectarPeajesCatalogo(circuito.legGeometrias);
      render();
      refrescarResumenCatalogo();
      estado("Catálogo nacional: "+circuito.peajes.length+
        " cruces o trayectos aceptados · "+diagnosticoDeteccion.descartados.length+
        " candidatos descartados · "+diagnosticoDeteccion.ambiguos.length+
        " cruces ambiguos no cobrados.");
    }else{
      circuito.peajes=[];
      render();
      estado("Peajes sin calcular: carga el catálogo nacional MOP/manual.");
    }
    guardar();
  }catch(err){
    avisar(mensajeDeError(err),true);
  }finally{
    $("btnBuscar").disabled=false;
  }
}

/* ============================================================
   Flujo
   ============================================================ */
function pintarSugerencias(lista,cont,alElegir){
  cont.innerHTML="";
  lista.forEach(function(item){
    var li=document.createElement("li");
    li.tabIndex=0;
    var p=item.display_name.split(", ");
    li.innerHTML="<strong>"+esc(p.slice(0,2).join(", "))+"</strong><small>"+
      esc(p.slice(2).join(", "))+"</small>";
    var el=function(){ cont.innerHTML=""; alElegir(item); };
    li.addEventListener("click",el);
    li.addEventListener("keydown",function(e){ if(e.key==="Enter") el(); });
    cont.appendChild(li);
  });
}

async function fijarBase(item){
  base={lat:parseFloat(item.lat),lon:parseFloat(item.lon),
        etiqueta:item.display_name.split(", ").slice(0,3).join(", ")};
  $("baseActual").textContent="Sales desde: "+base.etiqueta;
  $("dirBase").value="";
  await almacen.escribir("base-foto",JSON.stringify(base));
  avisar("Base guardada.",false);
  if(paradas.length) recalcular(false); else render();
}

function agregarParada(item){
  if(paradas.length>=8){
    avisar("Ocho paradas es el límite práctico para el servicio abierto de rutas.",true);
    return;
  }
  paradas.push({
    lat:parseFloat(item.lat),lon:parseFloat(item.lon),
    etiqueta:item.display_name.split(", ").slice(0,3).join(", "),
    tipo:tipoNuevaParada==="tecnica"?"tecnica":"propiedad",
    minutosTecnicos:tipoNuevaParada==="tecnica"?15:0
  });
  normalizarParadas();
  $("direccion").value="";
  recalcular(false);
}

async function buscar(texto,cont,alElegir){
  if(!texto.trim()){ avisar("Escribe una dirección o pega las coordenadas.",true); return; }
  cont.innerHTML="";
  var pt=interpretarCoordenadas(texto);
  if(pt&&pt.error){ avisar(pt.error,true); return; }
  if(pt){
    if(pt.fueraDeChile){
      avisar("Leí "+pt.leido+", que no cae en Chile. Revisa el orden de los valores "+
             "o si falta algún signo.",true);
      return;
    }
    avisar("Punto tomado de "+pt.origen+
      (pt.invertido?" (venían como longitud, latitud — las di vuelta)":"")+".",false);
    var n=await nombreDeCoordenadas(pt.lat,pt.lon);
    alElegir({lat:String(pt.lat),lon:String(pt.lon),
              display_name:n||(pt.lat.toFixed(5)+", "+pt.lon.toFixed(5))});
    return;
  }
  avisar("Buscando la dirección…",false);
  try{
    var res=await geocodificar(texto);
    avisar("",false);
    if(!res.length){ avisar("No se encontró. Prueba agregando la comuna, o pega las coordenadas del pin.",true); return; }
    if(res.length===1){ alElegir(res[0]); return; }
    pintarSugerencias(res,cont,alElegir);
  }catch(e){
    avisar(mensajeDeError(e),true);
  }
}

/* ============================================================
   Persistencia y eventos
   ============================================================ */
var CAMPOS=["minSitio","postproduccion","tarifa","rendimiento","precioL","desgaste","valorHora"];

function guardar(){
  clearTimeout(temporizador);
  temporizador=setTimeout(function(){
    var cfg={
      horaSalida:horaSalida,fechaSalida:$("fecha").value,campos:{},paradas:paradas,
      modoFin:modoFin,destinoFinal:destinoFinal,tipoNuevaParada:tipoNuevaParada
    };
    CAMPOS.forEach(function(k){ cfg.campos[k]=$(k).value; });
    almacen.escribir("config-foto",JSON.stringify(cfg));
  },700);
}

$("btnGoogleMaps").addEventListener("click",function(){
  abrirEtapaGoogle(0);
});

document.addEventListener("pointerdown",function(e){
  if(!selectorHoraAbierto) return;
  var wrap=$("hora24Wrap");
  if(wrap&&wrap.contains(e.target)) return;
  confirmarSelectorHora();
});
document.addEventListener("keydown",function(e){
  if(e.key!=="Escape"||!selectorHoraAbierto) return;
  selectorHoraAbierto=false;
  var panel=$("hora24Panel"),btn=$("horaSalidaBtn"),btnFecha=$("fechaSalidaBtn");
  if(panel) panel.hidden=true;
  if(btn) btn.setAttribute("aria-expanded","false");
  if(btnFecha) btnFecha.setAttribute("aria-expanded","false");
});

document.querySelectorAll("[data-tipo-nuevo]").forEach(function(b){
  b.addEventListener("click",function(){
    tipoNuevaParada=b.getAttribute("data-tipo-nuevo");
    document.querySelectorAll("[data-tipo-nuevo]").forEach(function(x){
      x.classList.toggle("activo",x===b);
    });
  });
});

document.querySelectorAll("[data-modo-fin]").forEach(function(b){
  b.addEventListener("click",function(){
    cambiarModoFin(b.getAttribute("data-modo-fin"));
  });
});
$("btnFin").addEventListener("click",function(){
  buscar($("dirFin").value,$("sugFin"),fijarDestinoFinal);
});
$("dirFin").addEventListener("keydown",function(e){
  if(e.key==="Enter") $("btnFin").click();
});
$("btnQuitarFin").addEventListener("click",quitarDestinoFinal);

$("btnBuscar").addEventListener("click",function(){
  if(!base){ avisar("Primero fija tu base de salida, abajo.",true); $("panelBase").open=true; return; }
  buscar($("direccion").value,$("sugerencias"),agregarParada);
});
$("direccion").addEventListener("keydown",function(e){ if(e.key==="Enter") $("btnBuscar").click(); });
$("btnBase").addEventListener("click",function(){ buscar($("dirBase").value,$("sugBase"),fijarBase); });
$("dirBase").addEventListener("keydown",function(e){ if(e.key==="Enter") $("btnBase").click(); });

$("btnBasePeajes").addEventListener("click",function(){ $("archivoBasePeajes").click(); });
$("btnTarifas").addEventListener("click",function(){ $("archivoTarifas").click(); });
$("btnCatalogo").addEventListener("click",function(){ $("archivoCatalogo").click(); });
$("btnRestaurarCatalogo").addEventListener("click",restaurarCatalogoIncluido);
$("btnQuitarCatalogo").addEventListener("click",quitarCatalogo);

[["archivoBasePeajes","geo"],["archivoTarifas","tarifas"],["archivoCatalogo","completo"]]
.forEach(function(par){
  $(par[0]).addEventListener("change",async function(){
    var f=this.files&&this.files[0];
    if(!f) return;
    actualizarEstadoCatalogo("","Cargando "+f.name+"…");
    try{ await cargarCatalogoArchivo(f,par[1]); }
    catch(e){ actualizarEstadoCatalogo("error","No se pudo cargar: "+e.message); }
    this.value="";
  });
});

CAMPOS.forEach(function(k){
  $(k).addEventListener("input",function(){ render(); guardar(); });
});

/* ============================================================
   Arranque
   ============================================================ */
(async function(){
  var h=new Date();
  $("fecha").value=h.getFullYear()+"-"+String(h.getMonth()+1).padStart(2,"0")+"-"+
    String(h.getDate()).padStart(2,"0");

  var g=await almacen.leer("config-foto");
  if(g){
    try{
      var cfg=JSON.parse(g);
      if(cfg.horaSalida&&hora24Valida(cfg.horaSalida)) horaSalida=cfg.horaSalida;
      if(cfg.fechaSalida&&fechaIsoValida(cfg.fechaSalida)) $("fecha").value=cfg.fechaSalida;
      if(cfg.modoFin) modoFin=modoFinValido(cfg.modoFin);
      if(cfg.destinoFinal&&isFinite(Number(cfg.destinoFinal.lat))&&
          isFinite(Number(cfg.destinoFinal.lon)))
        destinoFinal=cfg.destinoFinal;
      if(cfg.tipoNuevaParada==="tecnica") tipoNuevaParada="tecnica";
      if(Array.isArray(cfg.paradas)) paradas=cfg.paradas.filter(function(p){
        return p&&isFinite(Number(p.lat))&&isFinite(Number(p.lon));
      }).map(function(p){
        if(["propiedad","tecnica","final"].indexOf(p.tipo)<0) p.tipo="propiedad";
        if(p.tipo==="tecnica"&&!isFinite(Number(p.minutosTecnicos))) p.minutosTecnicos=15;
        return p;
      });
      normalizarParadas();
      if(cfg.campos) CAMPOS.forEach(function(k){
        if(cfg.campos[k]!==undefined) $(k).value=cfg.campos[k]; });
    }catch(e){}
  }

  var b=await almacen.leer("base-foto");
  if(b){ try{ base=JSON.parse(b);
    $("baseActual").textContent="Sales desde: "+base.etiqueta; }catch(e){} }
  else{
    $("panelBase").open=true;
    $("baseActual").textContent="Todavía no has fijado tu base. Ingresa tu dirección de salida.";
  }

  var geoGuardada=await almacen.leer(GEO_KEY);
  var tarifasGuardadas=await almacen.leer(TARIFAS_KEY);
  try{
    baseGeografica=geoGuardada?JSON.parse(geoGuardada):window.CATALOGO_GEOGRAFICO_INCLUIDO;
    paqueteTarifario=tarifasGuardadas?JSON.parse(tarifasGuardadas):window.PAQUETE_TARIFARIO_INCLUIDO;
    await reconstruirCatalogo(false);
  }catch(e){
    actualizarEstadoCatalogo("error","Los datos guardados no pudieron restaurarse: "+e.message);
  }

  renderAtajos();
  document.querySelectorAll("[data-tipo-nuevo]").forEach(function(b){
    b.classList.toggle("activo",b.getAttribute("data-tipo-nuevo")===tipoNuevaParada);
  });
  actualizarPanelFin();
  if(!indiceCatalogo) $("panelCatalogoNacional").open=true;
  if(base&&paradas.length&&finalRutaValido()) await recalcular(false);
  else render();
})();

})();
