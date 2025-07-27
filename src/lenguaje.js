Mila.Modulo({
  define:"Simu.Lenguaje",
  necesita:["$milascript/base","$pequescript/todo"],
  usa:["disenio"]
});

const tt = Peque.Tokens.texto;
const tl = Peque.Tokens.línea;
const ts = Peque.Tokens.salto;
const tiMas = Peque.Tokens.indentarMás;
const tiMenos = Peque.Tokens.indentarMenos;
const tn = Peque.Tokens.número;
const o = Peque.Tokens.disyunción;
const opt = Peque.Tokens.opcional;
const rep = Peque.Tokens.kleene;
const tv = Peque.Tokens.secuencia;
const tg = Peque.Tokens.grupo;

const P = function(tokens, nodo) {
  return Peque.Parser.Produccion.nueva({tokens, nodo});
};

Simu.Lenguaje.comandosPrimitivos = {
  "Escribir":{
    p:P([tt("Escribir"),tv("EXPRESIÓN"),tt("en"),tv("EXPRESIÓN")],function(tokens) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "Escribir",
        hijos: {pin:tokens[3],valor:tokens[1]}
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
    p:P([tt("Encender"),tt("led"),tv("EXPRESIÓN")],function(tokens) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "EncenderLed",
        hijos: {pin:tokens[2]}
      });
    }),
    exec:function(pin) {
      Simu.Diseño.EncenderLed(pin);
    }
  },
  "ApagarLed":{
    p:P([tt("Apagar"),tt("led"),tv("EXPRESIÓN")],function(tokens) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "ApagarLed",
        hijos: {pin:tokens[2]}
      });
    }),
    exec:function(pin) {
      Simu.Diseño.ApagarLed(pin);
    }
  },
  "EncenderBuzzer":{
    p:P([tt("Encender"),tt("buzzer"),tv("EXPRESIÓN")],function(tokens) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "EncenderBuzzer",
        hijos: {pin:tokens[2]}
      });
    }),
    exec:function(pin) {
      Simu.Diseño.EncenderBuzzer(pin);
    }
  },
  "ApagarBuzzer":{
    p:P([tt("Apagar"),tt("buzzer"),tv("EXPRESIÓN")],function(tokens) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "ApagarBuzzer",
        hijos: {pin:tokens[2]}
      });
    }),
    exec:function(pin) {
      Simu.Diseño.ApagarBuzzer(pin);
    }
  },
  "DibujarMatrizLed":{
    p:P([tt("Dibujar"),tv("EXPRESIÓN"),tt("en"),tv("IDENTIFICADOR")],function(tokens) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "DibujarMatrizLed",
        hijos: {dibujo:tokens[1],nombre:tokens[3]}
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
    p:P([tt("Esperar"),tv("EXPRESIÓN"),o([tt("ms"),tt("s"),tt("mms")])],function(tokens) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "Esperar",
        campos: {unidad:tokens[2].texto()},
        hijos: {cantidad:tokens[1]}
      });
    }),
    aJs:function(nodo, hijos) {
      let unidad = {ms:1,s:1000,mms:0.001}[nodo.unidad()];
      let cantidad = hijos.cantidad;
      let nCantidad = Number.parseFloat(cantidad);
      let cantidadMs = isNaN(nCantidad) ? `${cantidad}*${unidad}` : cantidad*unidad;
      return `Esperar(${cantidadMs});`;
    },
    exec:function(cantidadMilisegundos) {
      Simu.DetenerInterpretePor_Milisegundos(cantidadMilisegundos);
    }
  }
};

Simu.Lenguaje.expresionesPrimitivas = {
  "lecturaDigital":{
    p:P([tt("lectura"),tt("digital"),tv("EXPRESIÓN")],function(tokens) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "lecturaDigital",
        hijos: {pin:tokens[2]}
      });
    }),
    exec:function(pin) {
      return Simu.Diseño.lecturaDigital(pin);
    }
  },
  "lecturaAnalogica":{
    p:P([tt("lectura"),tt("analógica"),tv("EXPRESIÓN")],function(tokens) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "lecturaAnalogica",
        hijos: {pin:tokens[2]}
      });
    }),
    exec:function(pin) {
      return Simu.Diseño.lecturaAnalogica(pin);
    }
  },
  "distancia":{
    p:P([tt("distancia"),tv("EXPRESIÓN"),tt("a"),tv("EXPRESIÓN")],function(tokens) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "distancia",
        hijos: {echo:tokens[1],trigger:tokens[3]}
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
    p:P([tt("está"),o([tt("oscuro"),tt("iluminado")]),tv("EXPRESIÓN")],function(tokens) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "estáOscuro",
        campos: {neg:tokens[1].texto() == "oscuro"},
        hijos: {pin:tokens[2]}
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
    p:P([tt("nivel"),tt("de"),tt("luz"),tv("EXPRESIÓN")],function(tokens) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "luminosidad",
        hijos: {pin:tokens[3], intensidad:"RAW"}
      });
    }),
    aJs:function(nodo, hijos) {
      return `luminosidad({pin:${hijos.pin}, intensidad:${hijos.intensidad}})`;
    },
    exec:function(parametros) {
      return Simu.Diseño.luminosidad(parametros.pin, parametros.intensidad);
    }
  },
  "luminosidadPorcentaje":{
    p:P([tt("porcentaje"),tt("de"),tt("luminosidad"),tv("EXPRESIÓN")],function(tokens) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "luminosidad",
        hijos: {pin:tokens[3], intensidad:"PERCENT"}
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