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
  "EncenderLed":{
    p:P([tt("Encender"),tt("led"),tv("EXPRESIÓN")],function(tokens) {
      return Mila.AST.nuevoNodo({
        tipoNodo: "EncenderLed",
        hijos: {pin:tokens[2]}
      });
    }),
    exec:function(pin) {
      Simu.Diseño.AsignarValorPin(pin, "HIGH");
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
      Simu.Diseño.AsignarValorPin(pin, "LOW");
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

Simu.Lenguaje.mapaPrimitivas = {};
for (let k in Simu.Lenguaje.comandosPrimitivos) {
  Simu.Lenguaje.mapaPrimitivas[k] = Simu.Lenguaje.comandosPrimitivos[k].exec;
};