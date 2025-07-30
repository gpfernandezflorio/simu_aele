Mila.Modulo({
  define:"Simu.Lenguaje",
  necesita:["$milascript/base","$pequescript/todo"],
  usa:["disenio"]
});

const tt = Peque.Tokens.texto;

const tid = Peque.Tokens.tokenIdentificador();

const o = Peque.Tokens.disyunción;
const opt = Peque.Tokens.opcional;
const rep = Peque.Tokens.kleene;
const sec = Peque.Tokens.secuencia;
const rec = Peque.Tokens.recursivo;

const P = function(tokens, nodo) {
  return Peque.Parser.Produccion.nueva({tokens, nodo});
};

Simu.Lenguaje.comoPin = function(nodo) {
  switch (nodo.tipoNodo) {
    case 'LiteralNúmero':
      return nodo;
    case 'Identificador':
      let nombre = nodo.identificador();
      if (nombre in Simu.Diseño.placaActual.pines) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "LiteralTexto",
          campos: {valor: nombre},
          textoOriginal: nodo.textoOriginal
        });
      }
      // TODO: ver si es un valor
      throw `Pin desconocido: ${nombre}`;
  }
  throw `Pin desconocido (${nodo.tipoNodo})`;
};

Simu.Lenguaje.tiempoAJs = function(cantidad, unidad) {
  let multiplicador = {ms:1,s:1000,mms:0.001}[unidad];
  let nCantidad = Number.parseFloat(cantidad);
  return isNaN(nCantidad) ? `${cantidad}*${multiplicador}` : nCantidad*multiplicador;
};

Simu.Lenguaje.comandosPrimitivos = {
  "Escribir":{
    p:P([tt("Escribir"),rec("EXPRESIÓN"),tt("en"),rec("EXPRESIÓN")],function(tokens, textoOriginal) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "Escribir",
        hijos: {pin:Simu.Lenguaje.comoPin(tokens[3]),valor:tokens[1]},
        textoOriginal
      });
    }),
    aJs:function(nodo, hijos) {
      let pin = hijos.pin;
      let valor = hijos.valor;
      return `Escribir({pin:${pin},valor:${valor}});`;
    },
    exec:function(parametros) {
      Simu.Diseño.Escribir(parametros.pin, parametros.valor);
    }
  },
  "EncenderLed":{
    p:P([tt("Encender"),tt("led"),rec("EXPRESIÓN"),
      opt(sec([tt("con"),tt("intensidad"),rec("EXPRESIÓN"),opt(tt("%"))])),
      opt(sec([tt("durante"),rec("EXPRESIÓN"),opt(o([tt("ms"),tt("s"),tt("mms")]))]))
    ],function(tokens, textoOriginal) {
      const hijos = {pin:Simu.Lenguaje.comoPin(tokens[2])};
      let intensidad = "BINARIA";
      if (tokens.length > 3 && Peque.Parser.esTokenAtómico(tokens[3]) && tokens[3].texto() == 'con') {
        hijos.valor = tokens[5];
        intensidad = tokens.length > 6 && Peque.Parser.esTokenAtómico(tokens[6]) && tokens[6].texto() == '%'
          ? "PORCENTAJE"
          : "RAW"
        ;
      }
      const campos = {intensidad, unidad:'s'};
      if (tokens.length > 3 && Peque.Parser.esTokenAtómico(tokens[3]) && tokens[3].texto() == 'durante') {
        hijos.cantidad = tokens[4];
        campos.unidad = tokens.length > 5 ? tokens[5].texto() : 's';
      } else if (tokens.length > 6 && Peque.Parser.esTokenAtómico(tokens[6]) && tokens[6].texto() == 'durante') {
        hijos.cantidad = tokens[7];
        campos.unidad = tokens.length > 8 ? tokens[8].texto() : 's';
      } else if (tokens.length > 7 && Peque.Parser.esTokenAtómico(tokens[7]) && tokens[7].texto() == 'durante') {
        hijos.cantidad = tokens[8];
        campos.unidad = tokens.length > 9 ? tokens[9].texto() : 's';
      }
      return Mila.AST.nuevoNodo({
        tipoNodo: "EncenderLed",
        campos,
        hijos,
        textoOriginal
      });
    }),
    aJs:function(nodo, hijos) {
      let pin = hijos.pin;
      let intensidad = nodo.intensidad();
      let valor = hijos.defineLaClavePropia_('valor')
        ? hijos.valor
        : '"HIGH"'
      ;
      let código = `EncenderLed({pin:${pin},valor:${valor},intensidad:"${intensidad}"});`;
      if (hijos.defineLaClavePropia_('cantidad')) {
        código += `\nEsperar(${Simu.Lenguaje.tiempoAJs(hijos.cantidad, nodo.unidad())});\nApagarLed(${pin});`;
      }
      return código;
    },
    exec:function(parametros) {
      Simu.Diseño.SetLed(
        parametros.pin,
        parametros.valor,
        parametros.intensidad
      );
    }
  },
  "ApagarLed":{
    p:P([tt("Apagar"),tt("led"),rec("EXPRESIÓN")],function(tokens, textoOriginal) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "ApagarLed",
        hijos: {pin:Simu.Lenguaje.comoPin(tokens[2])},
        textoOriginal
      });
    }),
    exec:function(pin) {
      Simu.Diseño.SetLed(pin, "LOW", "BINARIA");
    }
  },
  "EncenderBuzzer":{
    p:P([tt("Encender"),tt("buzzer"),rec("EXPRESIÓN")],function(tokens, textoOriginal) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "EncenderBuzzer",
        hijos: {pin:Simu.Lenguaje.comoPin(tokens[2])},
        textoOriginal
      });
    }),
    exec:function(pin) {
      Simu.Diseño.EncenderBuzzer(pin);
    }
  },
  "ApagarBuzzer":{
    p:P([tt("Apagar"),tt("buzzer"),rec("EXPRESIÓN")],function(tokens, textoOriginal) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "ApagarBuzzer",
        hijos: {pin:Simu.Lenguaje.comoPin(tokens[2])},
        textoOriginal
      });
    }),
    exec:function(pin) {
      Simu.Diseño.ApagarBuzzer(pin);
    }
  },
  "DibujarMatrizLed":{
    p:P([tt("Dibujar"),rec("EXPRESIÓN"),tt("en"),tid],function(tokens, textoOriginal) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "DibujarMatrizLed",
        hijos: {dibujo:tokens[1],nombre:tokens[3]},
        textoOriginal
      });
    }),
    aJs:function(nodo, hijos) {
      let dibujo = hijos.dibujo;
      let nombre = `"${hijos.nombre}"`;
      return `DibujarMatrizLed({dibujo:${dibujo},nombre:${nombre}});`;
    },
    exec:function(parametros) {
      Simu.Diseño.DibujarMatrizLed(parametros.dibujo, Simu.Parser.identificadoresOriginales[parametros.nombre]);
    }
  },
  "Esperar":{
    p:P([tt("Esperar"),rec("EXPRESIÓN"),opt(o([tt("ms"),tt("s"),tt("mms")]))],function(tokens, textoOriginal) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "Esperar",
        campos: {unidad:tokens.length > 2 ? tokens[2].texto() : 's'},
        hijos: {cantidad:tokens[1]},
        textoOriginal
      });
    }),
    aJs:function(nodo, hijos) {
      let cantidadMs = Simu.Lenguaje.tiempoAJs(hijos.cantidad, nodo.unidad());
      return `Esperar(${cantidadMs});`;
    },
    exec:function(cantidadMilisegundos) {
      Simu.DetenerInterpretePor_Milisegundos(cantidadMilisegundos);
    }
  }
};

Simu.Lenguaje.expresionesPrimitivas = {
  "lecturaDigital":{
    p:P([tt("lectura"),tt("digital"),rec("EXPRESIÓN")],function(tokens, textoOriginal) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "lecturaDigital",
        hijos: {pin:Simu.Lenguaje.comoPin(tokens[2])},
        textoOriginal
      });
    }),
    exec:function(pin) {
      return Simu.Diseño.lecturaDigital(pin);
    }
  },
  "lecturaAnalogica":{
    p:P([tt("lectura"),tt("analógica"),rec("EXPRESIÓN")],function(tokens, textoOriginal) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "lecturaAnalogica",
        hijos: {pin:Simu.Lenguaje.comoPin(tokens[2])},
        textoOriginal
      });
    }),
    exec:function(pin) {
      return Simu.Diseño.lecturaAnalogica(pin);
    }
  },
  "distancia":{
    p:P([tt("distancia"),rec("EXPRESIÓN"),tt("a"),rec("EXPRESIÓN")],function(tokens, textoOriginal) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "distancia",
        hijos: {echo:Simu.Lenguaje.comoPin(tokens[1]),trigger:Simu.Lenguaje.comoPin(tokens[3])},
        textoOriginal
      });
    }),
    aJs:function(nodo, hijos) {
      let echo = hijos.echo;
      let trigger = hijos.trigger;
      return `distancia({echo:${echo},trigger:${trigger}})`;
    },
    exec:function(parametros) {
      return Simu.Diseño.distancia(parametros.echo, parametros.trigger);
    }
  },
  "estáOscuro":{
    p:P([tt("está"),o([tt("oscuro"),tt("iluminado")]),rec("EXPRESIÓN")],function(tokens, textoOriginal) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "estáOscuro",
        campos: {neg:tokens[1].texto() == "oscuro"},
        hijos: {pin:Simu.Lenguaje.comoPin(tokens[2])},
        textoOriginal
      });
    }),
    aJs:function(nodo, hijos) {
      return `${nodo.neg ? "" : "!"}estáOscuro(${hijos.pin})`;
    },
    exec:function(pin) {
      return Simu.Diseño.estáOscuro(pin);
    }
  },
  "luminosidad":{
    p:P([tt("nivel"),tt("de"),tt("luz"),rec("EXPRESIÓN")],function(tokens, textoOriginal) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "luminosidad",
        campos: {intensidad:"RAW"},
        hijos: {pin:Simu.Lenguaje.comoPin(tokens[3])},
        textoOriginal
      });
    }),
    aJs:function(nodo, hijos) {
      return `luminosidad({pin:${hijos.pin}, intensidad:"${nodo.intensidad()}"})`;
    },
    exec:function(parametros) {
      return Simu.Diseño.luminosidad(parametros.pin, parametros.intensidad);
    }
  },
  "luminosidadPorcentaje":{
    p:P([tt("porcentaje"),tt("de"),tt("luminosidad"),rec("EXPRESIÓN")],function(tokens, textoOriginal) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "luminosidad",
        campos: {intensidad:"PORCENTAJE"},
        hijos: {pin:Simu.Lenguaje.comoPin(tokens[3])},
        textoOriginal
      });
    })
  }
};

Simu.Lenguaje.mapaPrimitivas = {};
for (let k in Simu.Lenguaje.comandosPrimitivos) {
  if ('exec' in Simu.Lenguaje.comandosPrimitivos[k]) {
    Simu.Lenguaje.mapaPrimitivas[k] = Simu.Lenguaje.comandosPrimitivos[k].exec;
  }
};
for (let k in Simu.Lenguaje.expresionesPrimitivas) {
  if ('exec' in Simu.Lenguaje.expresionesPrimitivas[k]) {
    Simu.Lenguaje.mapaPrimitivas[k] = Simu.Lenguaje.expresionesPrimitivas[k].exec;
  }
};