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
      let cantidad = Number.parseFloat(hijos.cantidad);
      return `Esperar(${cantidad*unidad});`;
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
      Simu.Diseño.lecturaDigital(pin);
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
      Simu.Diseño.lecturaAnalogica(pin);
    }
  },
};

Simu.Lenguaje.mapaPrimitivas = {};
for (let k in Simu.Lenguaje.comandosPrimitivos) {
  Simu.Lenguaje.mapaPrimitivas[k] = Simu.Lenguaje.comandosPrimitivos[k].exec;
};
for (let k in Simu.Lenguaje.expresionesPrimitivas) {
  Simu.Lenguaje.mapaPrimitivas[k] = Simu.Lenguaje.expresionesPrimitivas[k].exec;
};