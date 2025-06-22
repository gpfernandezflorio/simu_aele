Mila.Modulo({
  define:"Simu",
  necesita:["$milascript/base"],
  usa:["$milascript/pantalla/todo",
    "../src/parser","../src/interprete","../src/lenguaje","../src/disenio",
    "$milascript/navegador"
  ]
});

Simu.ajustes = {
  mostrarCódigo:true
};

Mila.alIniciar(function() {
  let códigoRecibido = Mila.Navegador.argumentoUrl('codigo');
  if (códigoRecibido.esNada()) {
    Simu.IniciarSinCódigo();
  } else {
    Simu.ajustes.mostrarCódigo = false;
    Simu.IniciarConCódigo(códigoRecibido);
  }
});

Simu.IniciarSinCódigo = function() {
//   Simu.textoInicial = "\
// # Proyecto la luz del colegio {\n\
//   Si (true) {\n\
//     Encender led (12)\n\
//     Esperar (1000)\n\
//     Apagar led (12)\n\
//     Esperar (1000)\n\
//   } Si no, si (false) {\n\
//   } Si no {\n\
//   }\n\
//   Mientras (false) {\n\
//   }\n\
//   Hasta (true) {\n\
//   }\n\
// }";

  Simu.textoInicial = "\
Proyecto Blink {\n\
  Encender led 12\n\
  Esperar 1 s\n\
  Apagar led 12\n\
  Esperar 1 s\n\
}";
  Simu.IniciarConCódigo(Simu.textoInicial);
};

Simu.IniciarConCódigo = function(código) {
  Simu.areaTexto = Mila.Pantalla.nuevaAreaTexto({texto:código});
  let elementosEscritorio = [];
  if (Simu.ajustes.mostrarCódigo) {
    elementosEscritorio.push(Mila.Pantalla.nuevoPanel({elementos:[Simu.areaTexto],ancho:300}));
  }
  Simu.panelDiseño = Simu.Diseño.inicializar();
  elementosEscritorio.push(Simu.panelDiseño);
  Simu.escritorio = Mila.Pantalla.nuevoPanel({elementos:elementosEscritorio, disposicion: "Horizontal"});

  Simu.botonEjecutar = Mila.Pantalla.nuevoBoton({texto:"Ejecutar", funcion:Simu.Ejecutar});
  Simu.botonPausar = Mila.Pantalla.nuevoBoton({texto:"Pausar", funcion:Simu.Pausar});
  Simu.botonDetener = Mila.Pantalla.nuevoBoton({texto:"Detener", funcion:Simu.Detener});
  Simu.botonContinuar = Mila.Pantalla.nuevoBoton({texto:"Continuar", funcion:Simu.Continuar});
  Simu.botonReiniciar = Mila.Pantalla.nuevoBoton({texto:"Reiniciar", funcion:Simu.Reiniciar});
  Simu.botoneraEjecución = Mila.Pantalla.nuevoPanel({disposicion:"Horizontal",
    elementos:Simu.botonesDetenido(),alto:"Minimizar"
  });

  Simu.mostrarPinesDesconectados = Mila.Pantalla.nuevaCasillaVerificacion({
    funcion:Simu.Diseño.DibujarPines
  });
  Simu.menuSuperior = Mila.Pantalla.nuevoPanel({disposicion:"Horizontal",alto:"Minimizar",elementos:[
    Simu.botoneraEjecución,
    Mila.Pantalla.nuevaEtiqueta({texto:"Mostrar pines desconectados"}),
    Simu.mostrarPinesDesconectados
  ]});

  Simu.interprete = Simu.Interprete.nuevo(Simu.Lenguaje.mapaPrimitivas);

  Mila.Pantalla.nueva({elementos:[Simu.menuSuperior,Simu.escritorio]});
  Simu.Diseño.DibujarPines();
};

Simu.Ejecutar = function() {
  let código = Simu.areaTexto.texto();
  código = Simu.Parser.Parsear(código);
  if (código.esNada()) {
    return;
  }
  console.log(código);
  Simu.interprete.CargarCodigo(código);
  Simu.interprete.Ejecutar();
  Simu.botoneraEjecución.CambiarElementosA_(Simu.botonesEnEjecución());
};

Simu.Pausar = function() {
};

Simu.Detener = function() {
  Simu.interprete.Detener();
  Simu.Diseño.ReiniciarValoresPines();
  Simu.botoneraEjecución.CambiarElementosA_(Simu.botonesDetenido());
};

Simu.Continuar = function() {
};

Simu.Reiniciar = function() {
};

Simu.botonesDetenido = function() {
  return [Simu.botonEjecutar];
};

Simu.botonesEnEjecución = function() {
  return [
    // Simu.botonPausar,
    Simu.botonDetener,
    // Simu.botonReiniciar
  ];
};

Simu.DetenerInterpretePor_Milisegundos = function(cantidadMilisegundos) {
  Simu.interprete.Pausar();
  setTimeout(Simu.interprete.Continuar.bind(Simu.interprete), cantidadMilisegundos);
};