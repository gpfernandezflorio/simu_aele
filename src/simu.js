Mila.Modulo({
  define:"Simu",
  necesita:["$milascript/base"],
  usa:["$milascript/pantalla/todo","parser","interprete","lenguaje","disenio"]
});

Mila.alIniciar(function() {
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

  // CASILLA VERIFICACION
  Mila.Pantalla._CasillaVerificacion.prototype.marcado = function() {
    return this._nodoHtml.checked;
  };

  Simu.textoInicial = "\
# Proyecto Blink {\n\
  Encender led (12)\n\
  Esperar (1000)\n\
  Apagar led (12)\n\
  Esperar (1000)\n\
}";

  Simu.areaTexto = Mila.Pantalla.nuevaAreaTexto({texto:Simu.textoInicial});
  Simu.panelCodigo = Mila.Pantalla.nuevoPanel({elementos:[Simu.areaTexto],ancho:300});
  Simu.panelDiseño = Simu.Diseño.inicializar();
  Simu.escritorio = Mila.Pantalla.nuevoPanel({elementos:[Simu.panelCodigo,Simu.panelDiseño], disposicion: "Horizontal"});
  Simu.botonEjecutar = Mila.Pantalla.nuevoBoton({texto:"Ejecutar", funcion:Simu.Ejecutar});
  Simu.botonDetener = Mila.Pantalla.nuevoBoton({texto:"Detener", funcion:Simu.Detener});
  Simu.mostrarPinesDesconectados = Mila.Pantalla.nuevaCasillaVerificacion();
  Simu.menuSuperior = Mila.Pantalla.nuevoPanel({disposicion:"Horizontal",alto:"Minimizar",elementos:[
    Simu.botonEjecutar,Simu.botonDetener,
    Mila.Pantalla.nuevaEtiqueta({texto:"Mostrar pines desconectados"}),
    Simu.mostrarPinesDesconectados
  ]});

  Simu.interprete = Simu.Interprete.nuevo(Simu.Lenguaje.mapaPrimitivas);

  Mila.Pantalla.nueva({elementos:[Simu.menuSuperior,Simu.escritorio]});
  Simu.Diseño.DibujarPines();

  // PANEL
  for (let x of document.getElementsByTagName('div')) {
    x.style.border = '';
  }
});

Simu.Ejecutar = function() {
  if (Simu.interprete.enEjecución()) {
    Simu.interprete.Detener();
  }
  let código = Simu.areaTexto.texto();
  código = Simu.Parser.limpiarCódigo(código);
  if (código.esNada()) {
    return;
  }
  console.log(código);
  Simu.interprete.CargarCodigo(código);
  Simu.interprete.Ejecutar();
};

Simu.Detener = function() {
  if (Simu.interprete.enEjecución()) {
    Simu.interprete.Detener();
  }
  Simu.Diseño.ReiniciarValoresPines();
};

Simu.DetenerInterpretePor_Milisegundos = function(cantidadMilisegundos) {
  Simu.interprete.Pausar();
  setTimeout(Simu.interprete.Continuar.bind(Simu.interprete), cantidadMilisegundos);
};