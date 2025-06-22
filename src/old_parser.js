Mila.Modulo({
  define:"Simu.Parser",
  necesita:["$milascript/base","$milascript/objeto","$milascript/lista","lenguaje"]
});

const claveProyecto = "# Proyecto ";
const claveProcedimiento = "# Procedimiento ";
const claveFunción = "# Función ";
const claveAbreDefinición = " {";
const claveCierraDefinición = "}";
const claveAbreComentario = "/*";
const claveCierraComentario = "*/";
const claveAbreInvocación = "(";
const claveCierraInvocación = ")";
const claveCierraArgumento = ",";
const clavesComandosPrimitivos = Simu.Lenguaje.comandosPrimitivos.transformados((k,v) => v.idJs);
const clavesComandosCompuestos = {
  "Si":"if",
  "Si no":"else",
  "Si no, si":"else if",
  "Mientras":"while",
  "Hasta":function(argumento) {
    return `while (!${argumento})`;
  }
};

const datos = {};

Simu.Parser.limpiarCódigo = function(códigoOriginal) {
  datos.i = 0;
  datos.códigoOriginal = códigoOriginal;
  datos.líneas = códigoOriginal.split("\n");
  datos.códigoLimpio = [];
  delete datos.error;
  
  while (datos.i < datos.líneas.length) {
    Simu.Parser.limpiarCódigoLíneaDefinición();
    if (Simu.Parser.limpiarCódigoFalló()) {
      return Mila.Nada;
    }
  }
  if ('nombreProyecto' in datos) {
    datos.códigoLimpio.push(`while(1){${datos.nombreProyecto}();}`);
  } else {
    return Mila.Nada;
  }
  return datos.códigoLimpio.join("\n");
};

Simu.Parser.limpiarCódigoFalló = function() {
  return 'error' in datos;
};

Simu.Parser.limpiarCódigoLíneaDefinición = function() {
  let línea = datos.líneas[datos.i];
  if (línea.length == 0) {
    datos.i++;
  } else if (línea.startsWith(claveProyecto)) {
    Simu.Parser.limpiarCódigoLíneaProyecto();
  } else if (línea.startsWith(claveProcedimiento)) {
    Simu.Parser.limpiarCódigoLíneaProcedimiento();
  } else {
    console.log(línea);
    debugger;
  }
};

Simu.Parser.limpiarCódigoLíneaProyecto = function() {
  Simu.Parser.limpiarCódigoLíneaProcedimiento(true);
};

Simu.Parser.limpiarCódigoLíneaProcedimiento = function(esProyecto=false) {
  let línea = datos.líneas[datos.i];
  if (!línea.endsWith(claveAbreDefinición)) {
    datos.error = "X";
    return;
  }
  let nombre = línea.substring(
    (esProyecto ? claveProyecto : claveProcedimiento).length,
    línea.length - claveAbreDefinición.length
  );
  let parámetros = "()";
  if (!esProyecto) {
    let inicioInvocación = Simu.Parser.posicionDe_En_NoEscapeado(claveAbreInvocación, nombre);
    if (inicioInvocación > 0) {
      nombre = nombre.substring(0, inicioInvocación);
      parámetros = nombre.substring(inicioInvocación);
    }
  }

  nombre = Simu.Parser.limpiarIdentificador(nombre);
  parámetros = Simu.Parser.limpiarParámetros(parámetros);
  if (esProyecto) {
    datos.nombreProyecto = nombre;
  }
  datos.códigoLimpio.push(`function ${nombre}${parámetros}{`);
  datos.i++;
  Simu.Parser._ParsearCuerpo();
};

Simu.Parser._ParsearCuerpo = function() {
  Simu.Parser.limpiarCódigoCuerpo();
  if (Simu.Parser.limpiarCódigoFalló()) {
    return;
  }
  let finLínea = datos.j + claveCierraDefinición.length;
  datos.códigoLimpio.push(datos.líneas[datos.i].substring(0,finLínea));
  let restoLínea = datos.líneas[datos.i].substring(finLínea);
  datos.i++;
  datos.líneas.Insertar_EnPosicion_(restoLínea, datos.i+1);
};

Simu.Parser.limpiarCódigoCuerpo = function() {
  while (
    datos.i < datos.líneas.length &&
    !Simu.Parser.líneaCierraElCuerpo() &&
    !Simu.Parser.limpiarCódigoFalló()
  ) {
    Simu.Parser.limpiarCódigoLíneaComando();
  }
  if (datos.i >= datos.líneas.length) {
    datos.error = "X";
  }
};

Simu.Parser.limpiarCódigoLíneaComando = function() {
  let línea = datos.líneas[datos.i];
  if (Simu.Parser.líneaComienzaCon(clavesComandosPrimitivos.clavesDefinidas())) {
    Simu.Parser.limpiarCódigoLíneaComandoPrimitivo();
  } else if (Simu.Parser.líneaComienzaCon(clavesComandosCompuestos.clavesDefinidas())) {
    Simu.Parser.limpiarCódigoLíneaComandoCompuesto();
  } else {
    datos.códigoLimpio.push(línea);
    datos.i++;
  }
};

Simu.Parser.limpiarCódigoLíneaComandoPrimitivo = function() {
  let línea = datos.líneas[datos.i];
  let nuevaLínea = línea.substring(0, datos.j);
  let restoLínea = línea.substring(datos.j);
  let comando = clavesComandosPrimitivos.clavesDefinidas().elQueCumple_(x => restoLínea.startsWith(x));
  let inicioInvocación = restoLínea.indexOf(claveAbreInvocación, comando.length);
  if (inicioInvocación < 0) {
    datos.error = "X";
    return;
  }
  datos.j += inicioInvocación + claveAbreInvocación.length;
  let argumentos = Simu.Parser.limpiarCódigoArgumentos();
  if (Simu.Parser.limpiarCódigoFalló()) {
    return;
  }
  nuevaLínea += clavesComandosPrimitivos[comando] + claveAbreInvocación + argumentos;
  datos.códigoLimpio.push(nuevaLínea);
  datos.i++;
};

Simu.Parser.limpiarCódigoLíneaComandoCompuesto = function() {
  let línea = datos.líneas[datos.i];
  let nuevaLínea = línea.substring(0, datos.j);
  let restoLínea = línea.substring(datos.j);
  let comando = clavesComandosCompuestos.clavesDefinidas().elQueCumple_(x => restoLínea.startsWith(x));
  if (!línea.endsWith(claveAbreDefinición)) {
    datos.error = "X";
    return;
  }
  let argumentos = "";
  let inicioInvocación = restoLínea.indexOf(claveAbreInvocación, comando.length);
  if (inicioInvocación < 0) {
    if (comando != "Si no") {
      datos.error = "X";
      return;
    }
  } else {
    datos.j += inicioInvocación + claveAbreInvocación.length;
    argumentos = Simu.Parser.limpiarCódigoArgumentos();
    if (Simu.Parser.limpiarCódigoFalló()) {
      return;
    }
    argumentos = claveAbreInvocación + argumentos;
  }
  comando = clavesComandosCompuestos[comando];
  nuevaLínea += comando.esUnaFuncion()
    ? comando(argumentos)
    : comando + argumentos
  ;
  datos.códigoLimpio.push(`${nuevaLínea}{`);
  datos.i++;
  Simu.Parser._ParsearCuerpo();
};

Simu.Parser.limpiarCódigoArgumentos = function() {
  let línea = datos.líneas[datos.i];
  let argumentosLimpios = "";
  while (
    datos.j < línea.length &&
    !Simu.Parser.caracterCierraLosArgumentos() &&
    !Simu.Parser.limpiarCódigoFalló()
  ) {
    argumentosLimpios += Simu.Parser.limpiarCódigoArgumento();
  }
  if (datos.j >= línea.length) {
    datos.error = "X";
  }
  if (!Simu.Parser.limpiarCódigoFalló()) {
    return argumentosLimpios + claveCierraInvocación;
  }
  return Mila.Nada;
};

Simu.Parser.limpiarCódigoArgumento = function() {
  let línea = datos.líneas[datos.i];
  let inicio = datos.j;
  while (
    datos.j < línea.length &&
    !Simu.Parser.caracterCierraElArgumento()
  ) {
    datos.j++;
  }
  if (datos.j >= línea.length) {
    datos.error = "X";
    return Mila.Nada;
  }
  if (línea.substring(datos.j).startsWith(claveCierraArgumento)) {
    datos.j += claveCierraArgumento.length;
  }
  return línea.substring(inicio, datos.j);
};

Simu.Parser.líneaCierraElCuerpo = function() {
  return Simu.Parser.líneaComienzaCon(claveCierraDefinición);
};

Simu.Parser.caracterCierraElArgumento = function() {
  return Simu.Parser.caracterCierraLosArgumentos() ||
    Simu.Parser.líneaComienzaCon(claveCierraArgumento, datos.j);
};

Simu.Parser.caracterCierraLosArgumentos = function() {
  return Simu.Parser.líneaComienzaCon(claveCierraInvocación, datos.j);
};

Simu.Parser.posicionDe_En_NoEscapeado = function(búsqueda, texto) {
  let resultado = texto.indexOf(búsqueda);
  while (resultado > 0 && texto.charAt(resultado-1) == "\\") {
    resultado = texto.indexOf(búsqueda, resultado+1);
  }
  return resultado;
};

Simu.Parser.líneaComienzaCon = function(clave_o_claves, desde=0) {
  const claves = clave_o_claves.esUnaLista() ? clave_o_claves : [clave_o_claves]
  let línea = datos.líneas[datos.i];
  let j=desde;
  while(
    j < línea.length &&
    Simu.Parser.caracteresSalteables(línea, j) > 0
  ) {
    j += Simu.Parser.caracteresSalteables(línea, j);
  }
  datos.j = j;
  return j < línea.length && claves.algunoCumple_(x => línea.substring(j).startsWith(x));
};

Simu.Parser.caracteresSalteables = function(línea, j) {
  let k = j;
  while (
    k < línea.length &&
    (
      Simu.Parser.es_CaracterSalteable(línea[k]) ||
      Simu.Parser.es_InicioDeComentario(línea.substring(k))
    )
  ) {
    k = Simu.Parser.es_CaracterSalteable(línea[k]) ? k+1 : (
      Simu.Parser.hayCierreDeComentario(línea.substring(k+claveAbreComentario.length))
      ? línea.indexOf(claveCierraComentario, k+claveAbreComentario.length)
        + claveCierraComentario.length
      : línea.length
    );
  }
  return k-j;
};

Simu.Parser.es_CaracterSalteable = function(caracter) {
  return " \t".includes(caracter);
};

Simu.Parser.es_InicioDeComentario = function(texto) {
  return texto.startsWith("/*");
};

Simu.Parser.hayCierreDeComentario = function(texto) {
  return texto.indexOf(claveCierraComentario) >= 0;
};

Simu.Parser.limpiarIdentificador = function(identificadorOriginal) {
  let nuevoIdentificador = ""
  for (let letra of identificadorOriginal) {
    if (Simu.Parser.es_CaracterValidoParaIdentificador(letra)) {
      nuevoIdentificador += letra;
    } else {
      nuevoIdentificador += "_";
    }
  }
  if (Simu.Parser.es_CaracterNumerico(nuevoIdentificador[0])) {
    nuevoIdentificador = `_${nuevoIdentificador}`;
  }
  return nuevoIdentificador;
};

Simu.Parser.limpiarParámetros = function(parámetrosOriginales) {
  // TODO: identificar cada parámetro e invocar a limpiarIdentificador con cada uno
  return parámetrosOriginales;
};

Simu.Parser.es_CaracterNumerico = function(caracter) {
  return "1234567890".includes(caracter);
};

Simu.Parser.es_CaracterValidoParaIdentificador = function(caracter) {
  return Simu.Parser.es_CaracterNumerico(caracter) ||
    "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM_".includes(caracter);
};