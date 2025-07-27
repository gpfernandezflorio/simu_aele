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

const tokensDibujo8x8 = [];
for (let i=0; i<64; i++) {
  tokensDibujo8x8.push(o([tt("O"),tt("_")]));
}

Simu.Parser.configuración = {
  agrupadores: {
    COMANDO: "llavesConSalto",
    EXPRESIÓN: "paréntesis"
  },
  producciones: {
    EXPRESIÓN: Simu.Parser.produccionesPara_(Simu.Lenguaje.expresionesPrimitivas).concatenadaCon_([
      P(tg("EXPRESIÓN"),function(tokens) {
        return Peque.Parser.nodoExpresión(tokens[0].contenido());
      }),
      P(tn(),function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "LiteralNúmero",
          campos: {valor:tokens[0].n()}
        });
      }),
      P(o([tt("cierto"),tt("falso")]),function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "LiteralBooleano",
          campos: {valor:tokens[0].texto()}
        });
      }),
      P(tokensDibujo8x8,function(tokens) {
        let luces = tokens.map(x=>x.texto());
        return Mila.AST.nuevoNodo({
          tipoNodo: "LiteralDibujo8x8",
          campos: {valor:luces}
        });
      }),
      P(o([tt("HIGH"),tt("LOW")]),function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "LiteralCorriente",
          campos: {valor:tokens[0].texto()}
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
      P([tv("EXPRESIÓN"),o([
        tt("+"),
        tt("-"),
        tt("."),
        tt("%"),
        tt("^")
      ]),tv("EXPRESIÓN")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "OperaciónBinariaAritmética",
          campos: {clase:tokens[1].texto()},
          hijos: {izquierdo:tokens[0],derecho:tokens[2]}
        });
      }),
      P([tt("es"),tv("EXPRESIÓN"),o([
        tt("mayor"),
        tt("menor"),
        tt(">="),
        tt("<="),
        tt("igual"),
        tt("distinto")
      ]),tt("a"),tv("EXPRESIÓN")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "OperaciónBinariaComparación",
          campos: {clase:tokens[2].texto()},
          hijos: {izquierdo:tokens[1],derecho:tokens[4]}
        });
      }),
      P([tt("no"),tv("EXPRESIÓN")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "NegaciónLógica",
          hijos: {operando:tokens[1]}
        });
      }),
      P(tv("IDENTIFICADOR"),function(tokens) {
        // TODO: puede ser una invocación a función o un identificador (una variable, un parámetro, un índice o un valor).
          // Para el caso de la función, ver la nota del identificador de comandos.
        return Mila.AST.nuevoNodo({
          tipoNodo: "Identificador",
          campos: {identificador: tokens[0].identificador()}
        });
      })
    ]),
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
        // Un identificador como comando sólo puede ser una invocación a procedimiento.
        // TODO: ver si lleva argumentos.
          // Ojo: tokens[0] es un único token identificador cuyo campo 'identificador' es el string completo.
          // Quizás agregar una producción por cada definición de procedimiento y que esta sea la de una invocación
            // a un comando no definido.
        return Mila.AST.nuevoNodo({
          tipoNodo: "InvocaciónProcedimiento",
          campos: {identificador: tokens[0].identificador()}
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
  Simu.Parser.identificadoresOriginales = {}; // Borro cualquier data anterior
  const ast = Simu.Parser.parser.parsear(códigoOriginal);
  // TODO: ¡verificar si falló al parsear!
  const js = ast.transformados(function(n) {
    return Simu.Parser.nodoAJs(n);
  });
  return js.snoc(`while(1){${datos.nombreProyecto}();}`).join("\n")
};

Simu.Parser.operaciónBinaria = function(nodo, hijos) {
  let op = nodo.clase();
  if (op == "^") {
    return `Math.pow(${hijos.izquierdo},${hijos.derecho})`;
  }
  op = {
    "+":"+",
    "-":"-",
    ".":"*",
    "%":"/",
    "mayor":">",
    "menor":"<",
    ">=":">=",
    "<=":"<=",
    "igual":"==",
    "distinto":"!=",
    "Conjunción":"&&",
    "Disyunción":"||"
  }[op];
  return `((${hijos.izquierdo}) ${op} (${hijos.derecho}))`
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
  AlternativaCondicionalCompuesta: function(nodo, hijos) {
    return `if (${hijos.condición}) ${hijos.ramaPositiva} else ${hijos.ramaNegativa}`;
  },
  RepeticiónSimple: function(nodo, hijos) {
    return `for (let i=0; i<${hijos.cantidad}; i++) ${hijos.cuerpo}`;
  },
  RepeticiónCondicional: function(nodo, hijos) {
    return `while (${
      nodo.clase() == "Mientras" ? "" : "!"
    }${hijos.condición}) ${hijos.cuerpo}`;
  },
  InvocaciónProcedimiento: function(nodo, hijos) {
    return `${Simu.Parser.identificadorVálido(nodo.identificador())}();`;
  },
  LiteralNúmero: function(nodo, hijos) {
    return `${nodo.valor()}`;
  },
  LiteralBooleano: function(nodo, hijos) {
    return `${nodo.valor() == "cierto" ? "true" : "false"}`;
  },
  LiteralDibujo8x8: function(nodo, hijos) {
    return `[${nodo.valor().map(x=>`"${x}"`).join(",")}]`;
  },
  LiteralCorriente: function(nodo, hijos) {
    return `"${nodo.valor()}"`;
  },
  Identificador: function(nodo, hijos) {
    return Simu.Parser.identificadorVálido(nodo.identificador());
  },
  NegaciónLógica: function(nodo, hijos) {
    return `!(${hijos.operando})`;
  },
  OperaciónBinariaLógica: function(nodo, hijos) {
    return Simu.Parser.operaciónBinaria(nodo, hijos);
  },
  OperaciónBinariaAritmética: function(nodo, hijos) {
    return Simu.Parser.operaciónBinaria(nodo, hijos);
  },
  OperaciónBinariaComparación: function(nodo, hijos) {
    return Simu.Parser.operaciónBinaria(nodo, hijos);
  },
  COMANDO: function(nodo, hijos) {
    return `{\n${hijos.contenido.transformados(x=>`  ${x}`).join("\n")}\n}`;
  },
  Nodo: function(nodo, hijos) {
    throw nodo.tipoNodo;
  }
};

Simu.Parser.caracteresNuméricos = "1234567890";

Simu.Parser.caracteresVálidosIdentificador = Simu.Parser.caracteresNuméricos +
  "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM_"
  // + "ñÑáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜâêîôûÂÊÎÔÛ"
;

Simu.Parser.caracteresValidablesIdentificador = {
  ñ:"n",
  Ñ:"N",
  á:"a",
  é:"e",
  í:"i",
  ó:"o",
  ú:"u",
  Á:"A",
  É:"E",
  Í:"I",
  Ó:"O",
  Ú:"U",
  à:"a",
  è:"e",
  ì:"i",
  ò:"o",
  ù:"u",
  À:"A",
  È:"E",
  Ì:"I",
  Ò:"O",
  Ù:"U",
  ä:"a",
  ë:"e",
  ï:"i",
  ö:"o",
  ü:"u",
  Ä:"A",
  Ë:"E",
  Ï:"I",
  Ö:"O",
  Ü:"U",
  â:"a",
  ê:"e",
  î:"i",
  ô:"o",
  û:"u",
  Â:"A",
  Ê:"E",
  Î:"I",
  Ô:"O",
  Û:"U",
  '?':"P",
  '!':"I",
  '(':"C",
  ')':"D",
  '"':"_",
  '#':"R",
  '$':"S",
  '%':"X",
  '&':"X",
  '/':"I",
  '\\':"I",
  '|':"I",
  '°':"o",
  '@':"O",
  '¡':"I",
  '¿':"L",
  '>':"Z",
  '<':"K",
  '-':"H",
  '.':"_",
  ',':"_",
  ':':"i",
  ';':"j",
  '[':"L",
  ']':"J",
  '{':"K",
  '}':"J",
  '+':"t",
  '*':"x",
  '~':"s",
  "'":"T",
  '`':"_",
  '´':"_",
  '^':"_",
  '¨':"_",
  '=':"H",
  '¬':"h",
  ' ':"_"
};

Simu.Parser.identificadoresOriginales = {};

Simu.Parser.identificadorVálido = function(identificadorOriginal) {
  let nuevoIdentificador = identificadorOriginal.length == 0 || Simu.Parser.caracteresNuméricos.includes(identificadorOriginal[0])
    ? "_"
    : ""
  ;
  for (let c of identificadorOriginal) {
    if (Simu.Parser.caracteresVálidosIdentificador.includes(c)) {
      nuevoIdentificador += c;
    } else if (c in Simu.Parser.caracteresValidablesIdentificador) {
      nuevoIdentificador += Simu.Parser.caracteresValidablesIdentificador[c];
    }
  }
  while (nuevoIdentificador in Simu.Parser.identificadoresOriginales &&
    Simu.Parser.identificadoresOriginales[nuevoIdentificador] != identificadorOriginal
  ) {
    nuevoIdentificador += 'x';
  }
  Simu.Parser.identificadoresOriginales[nuevoIdentificador] = identificadorOriginal;
  return nuevoIdentificador;
};

for (let c in Simu.Lenguaje.comandosPrimitivos) {
  if ('exec' in Simu.Lenguaje.comandosPrimitivos[c]) {
    Simu.Parser.dataNodoAJs[c] = function(nodo, hijos) {
      return Simu.Parser.comandoPrimitivoJs(c, nodo, hijos);
    }
  }
};

for (let c in Simu.Lenguaje.expresionesPrimitivas) {
  if ('exec' in Simu.Lenguaje.expresionesPrimitivas[c]) {
    Simu.Parser.dataNodoAJs[c] = function(nodo, hijos) {
      return Simu.Parser.expresiónPrimitivaJs(c, nodo, hijos);
    }
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

Simu.Parser.expresiónPrimitivaJs = function(c, nodo, hijos) {
  if ('aJs' in Simu.Lenguaje.expresionesPrimitivas[c]) {
    return Simu.Lenguaje.expresionesPrimitivas[c].aJs(nodo, hijos);
  }
  return `${c}(${hijos.fold(function(clave, valor, rec) {
    return rec.cons(valor);
  }, []).join(",")})`;
};

Simu.Parser.nodoAJs = function(nodo) {
  return nodo.fold(Simu.Parser.dataNodoAJs);
};