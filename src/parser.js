Mila.Modulo({
  define:"Simu.Parser",
  necesita:["$pequescript/todo","$milascript/ast","lenguaje"]
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

Simu.Parser.produccionesPara_ = function(operaciones) {
  return operaciones.fold(function(clave, valor, rec) {
    return rec.cons(valor.p);
  }, []);
};

const datos = {};

Simu.Parser.configuración = {
  agrupadores: {
    COMANDO: "llavesConSalto",
    EXPRESIÓN: "paréntesis"
  },
  producciones: {
    EXPRESIÓN: [
      P(tg("EXPRESIÓN"),function(tokens) {
        return Peque.Parser.nodoExpresión(tokens[0].contenido());
      }),
      P(tn(),function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "LiteralNúmero",
          campos: {valor:tokens[0].n()}
        });
      }),
      P([tv("EXPRESIÓN"),tt("y"),tv("EXPRESIÓN")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "OperaciónBinariaLógica",
          campos: {clase:"Conjunción"},
          hijos: {izquierdo:tokens[0],derecho:tokens[2]}
        });
      }),
      P([tv("EXPRESIÓN"),tt("o"),tv("EXPRESIÓN")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "OperaciónBinariaLógica",
          campos: {clase:"Disyunción"},
          hijos: {izquierdo:tokens[0],derecho:tokens[2]}
        });
      }),
      P([tt("no"),tv("EXPRESIÓN")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "NegaciónLógica",
          hijos: {operando:tokens[1]}
        });
      }),
      P(tv("IDENTIFICADOR"),function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "Identificador",
          campos: {identificador: tokens.map(Peque.Parser.textoOriginal).join(" ")}
        });
      })
    ],
    COMANDO: Simu.Parser.produccionesPara_(Simu.Lenguaje.comandosPrimitivos).concatenadaCon_([
      P([tt("Si"),tv("EXPRESIÓN"),tg("COMANDO"),opt(ts()),tt("Si"),tt("no"),tg("COMANDO")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "AlternativaCondicionalCompuesta",
          hijos: {condición:tokens[1], ramaPositiva:tokens[2], ramaNegativa:tokens[5]}
        });
      }),
      P([tt("Si"),tv("EXPRESIÓN"),tg("COMANDO")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "AlternativaCondicionalSimple",
          hijos: {condición:tokens[1], ramaPositiva:tokens[2]}
        });
      }),
      P([tt("Repetir"),tv("EXPRESIÓN"),tg("COMANDO")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "RepeticiónSimple",
          hijos: {cantidad:tokens[1], cuerpo:tokens[2]}
        });
      }),
      P([o([tt("Mientras"),tt("Hasta")]),tv("EXPRESIÓN"),tg("COMANDO")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "RepeticiónCondicional",
          campos: {clase: tokens[0].texto()},
          hijos: {condición:tokens[1], cuerpo:tokens[2]}
        });
      }),
      P(tv("IDENTIFICADOR"),function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "Identificador",
          campos: {identificador: tokens.map(Peque.Parser.textoOriginal).join(" ")}
        });
      })
    ]),
    DEFINICION: [
      P([tt("Proyecto"),tv("IDENTIFICADOR"),tg("COMANDO")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "DefiniciónProyecto",
          hijos: {nombre:tokens[1], cuerpo:tokens[2]}
        });
      }),
      P([tt("Procedimiento"),tv("IDENTIFICADOR"),tg("COMANDO")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "DefiniciónProcedimiento",
          hijos: {nombre:tokens[1], cuerpo:tokens[2]}
        });
      })
    ]
  }
};

Mila.alIniciar(function() {
  Simu.Parser.parser = Peque.Parser.nuevo(
    Peque.Parser.nuevaConfiguración(
      Simu.Parser.configuración
    )
  );
});

Simu.Parser.Parsear = function(códigoOriginal) {
  const ast = Simu.Parser.parser.parsear(códigoOriginal);
  // TODO: ¡verificar si falló al parsear!
  const js = ast.transformados(function(n) {
    return Simu.Parser.nodoAJs(n);
  });
  return js.snoc(`while(1){${datos.nombreProyecto}();}`).join("\n")
};

Simu.Parser.dataNodoAJs = {
  DefiniciónProyecto: function(nodo, hijos) {
    datos.nombreProyecto = hijos.nombre;
    return `function ${hijos.nombre}() ${hijos.cuerpo}`;
  },
  DefiniciónProcedimiento: function(nodo, hijos) {
    return `function ${hijos.nombre}() ${hijos.cuerpo}`;
  },
  AlternativaCondicionalSimple: function(nodo, hijos) {
    return `if (${hijos.condición}) ${hijos.ramaPositiva}`;
  },
  RepeticiónSimple: function(nodo, hijos) {
    return `for (let i=0; i<${hijos.cantidad}; i++) ${hijos.cuerpo}`;
  },
  LiteralNúmero: function(nodo, hijos) {
    return `${nodo.valor()}`;
  },
  Identificador: function(nodo, hijos) {
    return nodo.identificador();
  },
  COMANDO: function(nodo, hijos) {
    return `{\n${hijos.contenido.transformados(x=>`  ${x}`).join("\n")}\n}`;
  },
  Nodo: function(nodo, hijos) {
    throw nodo.tipoNodo;
  }
};

for (let c in Simu.Lenguaje.comandosPrimitivos) {
  Simu.Parser.dataNodoAJs[c] = function(nodo, hijos) {
    return Simu.Parser.comandoPrimitivoJs(c, nodo, hijos);
  }
};

Simu.Parser.comandoPrimitivoJs = function(c, nodo, hijos) {
  if ('aJs' in Simu.Lenguaje.comandosPrimitivos[c]) {
    return Simu.Lenguaje.comandosPrimitivos[c].aJs(nodo, hijos);
  }
  return `${c}(${hijos.fold(function(clave, valor, rec) {
    return rec.cons(valor);
  }, []).join(",")});`;
};

Simu.Parser.nodoAJs = function(nodo) {
  return nodo.fold(Simu.Parser.dataNodoAJs);
};