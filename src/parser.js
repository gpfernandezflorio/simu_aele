Mila.Modulo({
  define:"Simu.Parser",
  necesita:["$pequescript/todo","$milascript/ast","lenguaje"]
});

const tt = Peque.Tokens.texto;
const ts = Peque.Tokens.salto();

const tid = Peque.Tokens.tokenIdentificador();

const o = Peque.Tokens.disyunción;
const opt = Peque.Tokens.opcional;
const rep = Peque.Tokens.kleene;
const tg = Peque.Tokens.agrupado;
const rec = Peque.Tokens.recursivo;

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
      P(tg("EXPRESIÓN"),function(tokens, textoOriginal) {
        if (tokens[0].contenido().length != 1) { debugger; }
        return tokens[0].contenido()[0];
      }),
      P(o([tt("cierto"),tt("falso")]),function(tokens, textoOriginal) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "LiteralBooleano",
          campos: {valor:tokens[0].texto()},
          textoOriginal
        });
      }),
      P([tt('"'),tid,tt('"')],function(tokens, textoOriginal) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "LiteralTexto",
          campos: {valor:tokens[1].identificador()},
          textoOriginal
        });
      }),
      P(tokensDibujo8x8,function(tokens, textoOriginal) {
        let luces = tokens.map(x=>x.texto());
        return Mila.AST.nuevoNodo({
          tipoNodo: "LiteralDibujo8x8",
          campos: {valor:luces},
          textoOriginal
        });
      }),
      P(o([tt("HIGH"),tt("LOW")]),function(tokens, textoOriginal) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "LiteralCorriente",
          campos: {valor:tokens[0].texto()},
          textoOriginal
        });
      }),
      P([rec("EXPRESIÓN"),tt("y"),rec("EXPRESIÓN")],function(tokens, textoOriginal) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "OperaciónBinariaLógica",
          campos: {clase:"Conjunción"},
          hijos: {izquierdo:tokens[0],derecho:tokens[2]},
          textoOriginal
        });
      }),
      P([rec("EXPRESIÓN"),tt("o"),rec("EXPRESIÓN")],function(tokens, textoOriginal) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "OperaciónBinariaLógica",
          campos: {clase:"Disyunción"},
          hijos: {izquierdo:tokens[0],derecho:tokens[2]},
          textoOriginal
        });
      }),
      P([rec("EXPRESIÓN"),o([
        tt("+"),
        tt("-"),
        tt("."),
        tt("%"),
        tt("^")
      ]),rec("EXPRESIÓN")],function(tokens, textoOriginal) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "OperaciónBinariaAritmética",
          campos: {clase:tokens[1].texto()},
          hijos: {izquierdo:tokens[0],derecho:tokens[2]},
          textoOriginal
        });
      }),
      P([tt("es"),rec("EXPRESIÓN"),o([
        tt("mayor"),
        tt("menor"),
        tt(">="),
        tt("<="),
        tt("igual"),
        tt("distinto")
      ]),tt("a"),rec("EXPRESIÓN")],function(tokens, textoOriginal) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "OperaciónBinariaComparación",
          campos: {clase:tokens[2].texto()},
          hijos: {izquierdo:tokens[1],derecho:tokens[4]},
          textoOriginal
        });
      }),
      P([tt("no"),rec("EXPRESIÓN")],function(tokens, textoOriginal) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "NegaciónLógica",
          hijos: {operando:tokens[1]},
          textoOriginal
        });
      }),
      P(tid,function(tokens, textoOriginal) {
        let n = Number.parseFloat(tokens[0].identificador());
        if (isNaN(n)) {
          // TODO: puede ser una invocación a función o un identificador (una variable, un parámetro, un índice o un valor).
            // Para el caso de la función, ver la nota del identificador de comandos.
          return Mila.AST.nuevoNodo({
            tipoNodo: "Identificador",
            campos: {identificador: tokens[0].identificador()},
            textoOriginal
          });
        } else {
          return Mila.AST.nuevoNodo({
            tipoNodo: "LiteralNúmero",
            campos: {valor:n}
          });
        }
      })
    ]),
    COMANDO: Simu.Parser.produccionesPara_(Simu.Lenguaje.comandosPrimitivos).concatenadaCon_([
      P([tt("Si"),rec("EXPRESIÓN"),tg("COMANDO"),opt(ts),tt("Si"),tt("no"),tg("COMANDO")],function(tokens, textoOriginal) {
        let iRamaNegativa = tokens.length-1;
        return Mila.AST.nuevoNodo({
          tipoNodo: "AlternativaCondicionalCompuesta",
          hijos: {condición:tokens[1], ramaPositiva:tokens[2].contenido(), ramaNegativa:tokens[iRamaNegativa].contenido()},
          textoOriginal
        });
      }),
      P([tt("Si"),rec("EXPRESIÓN"),tg("COMANDO")],function(tokens, textoOriginal) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "AlternativaCondicionalSimple",
          hijos: {condición:tokens[1], ramaPositiva:tokens[2].contenido()},
          textoOriginal
        });
      }),
      P([tt("Repetir"),rec("EXPRESIÓN"),tg("COMANDO")],function(tokens, textoOriginal) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "RepeticiónSimple",
          hijos: {cantidad:tokens[1], cuerpo:tokens[2].contenido()},
          textoOriginal
        });
      }),
      P([o([tt("Mientras"),tt("Hasta")]),rec("EXPRESIÓN"),tg("COMANDO")],function(tokens, textoOriginal) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "RepeticiónCondicional",
          campos: {clase: tokens[0].texto()},
          hijos: {condición:tokens[1], cuerpo:tokens[2].contenido()},
          textoOriginal
        });
      }),
      P(tid,function(tokens, textoOriginal) {
        // Un identificador como comando sólo puede ser una invocación a procedimiento.
        // TODO: ver si lleva argumentos.
          // Ojo: tokens[0] es un único token identificador cuyo campo 'identificador' es el string completo.
          // Quizás agregar una producción por cada definición de procedimiento y que esta sea la de una invocación
            // a un comando no definido.
        return Mila.AST.nuevoNodo({
          tipoNodo: "InvocaciónProcedimiento",
          campos: {identificador: tokens[0].identificador()},
          textoOriginal
        });
      })
    ]),
    DEFINICION: [
      P([tt("Proyecto"),tid,tg("COMANDO")],function(tokens, textoOriginal) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "DefiniciónProyecto",
          hijos: {nombre:tokens[1], cuerpo:tokens[2].contenido()},
          textoOriginal
        });
      }),
      P([tt("Procedimiento"),tid,tg("COMANDO")],function(tokens, textoOriginal) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "DefiniciónProcedimiento",
          hijos: {nombre:tokens[1], cuerpo:tokens[2].contenido()},
          textoOriginal
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

const s = function(k) {
  let resultado = "";
  for (let i=0; i<k; i++) {
    resultado += "  ";
  }
  return resultado;
};

Simu.Parser._cuerpoAJs = function(cuerpo) {
  return `{\n${cuerpo.join('\n')}\n}\n`
};

Simu.Parser.dataNodoAJs = {
  DefiniciónProyecto: function(nodo, hijos) {
    datos.nombreProyecto = hijos.nombre;
    return `${s(nodo.nivel)}function ${hijos.nombre}() ${Simu.Parser._cuerpoAJs(hijos.cuerpo)}`;
  },
  DefiniciónProcedimiento: function(nodo, hijos) {
    return `${s(nodo.nivel)}function ${hijos.nombre}() ${Simu.Parser._cuerpoAJs(hijos.cuerpo)}`;
  },
  AlternativaCondicionalSimple: function(nodo, hijos) {
    return `${s(nodo.nivel)}if (${hijos.condición}) ${Simu.Parser._cuerpoAJs(hijos.ramaPositiva)}`;
  },
  AlternativaCondicionalCompuesta: function(nodo, hijos) {
    return `${s(nodo.nivel)}if (${hijos.condición}) ${Simu.Parser._cuerpoAJs(hijos.ramaPositiva)} else ${Simu.Parser._cuerpoAJs(hijos.ramaNegativa)}`;
  },
  RepeticiónSimple: function(nodo, hijos) {
    return `${s(nodo.nivel)}for (let i=0; i<${hijos.cantidad}; i++) ${Simu.Parser._cuerpoAJs(hijos.cuerpo)}`;
  },
  RepeticiónCondicional: function(nodo, hijos) {
    return `${s(nodo.nivel)}while (${
      nodo.clase() == "Mientras" ? "" : "!"
    }${hijos.condición}) ${Simu.Parser._cuerpoAJs(hijos.cuerpo)}`;
  },
  InvocaciónProcedimiento: function(nodo, hijos) {
    return `${s(nodo.nivel)}${Simu.Parser.identificadorVálido(nodo.identificador())}();\n`;
  },
  LiteralNúmero: function(nodo, hijos) {
    return `${nodo.valor()}`;
  },
  LiteralBooleano: function(nodo, hijos) {
    return `${nodo.valor() == "cierto" ? "true" : "false"}`;
  },
  LiteralTexto: function(nodo, hijos) {
    return `"${nodo.valor()}"`;
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
  Atómico: function(nodo, hijos) {
    // Asumo que es Texto
    if (nodo.token().clase != "Texto") { debugger; }
    return nodo.token().contenido;
  },
  Nodo: function(nodo, hijos) {
    debugger;
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
    return s(nodo.nivel) + Simu.Lenguaje.comandosPrimitivos[c].aJs(nodo, hijos).split("\n").join(`\n${s(nodo.nivel)}`);
  }
  return `${s(nodo.nivel)}${c}(${hijos.fold(function(clave, valor, rec) {
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