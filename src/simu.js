Mila.Modulo({
  define:"Simu",
  necesita:["$milascript/base"],
  usa:["$milascript/pantalla/todo",
    "../src/parser","../src/interprete","../src/lenguaje","../src/disenio",
    "$milascript/navegador"
  ]
});

Simu.ajustes = {
  modoCódigo:"EDITAR", // VER, EDITAR, NO
  modoVer:"MODULOS", // PINES, MODULOS
  placa:"UNO" // UNO MEGA NANO ...
};

Mila.alIniciar(function() {
  let códigoRecibido = Mila.Navegador.argumentoUrl('codigo');
  if (códigoRecibido.esNada()) {
    Simu.IniciarSinCódigo();
  } else {
    Simu.ajustes.modoCódigo = "NO";
    Simu.IniciarConCódigo(códigoRecibido);
  }
});

Simu.IniciarSinCódigo = function() {

  Simu.textoInicial = "\
Proyecto proyecto sin nombre {\n\
  Si está oscuro 5 {\n\
    Encender led 8\n\
  } Si no {\n\
    Apagar led 8\n\
  }\n\
  Si es distancia 3 a 6\n\
    menor a 25 {\n\
    Dibujar\n\
      _ _ _ _ _ _ _ _\n\
      _ O O _ _ O O _\n\
      O _ _ O O _ _ O\n\
      O _ _ _ _ _ O O\n\
      O _ _ _ _ _ _ O\n\
      _ O _ _ _ _ O _\n\
      _ _ O _ _ O _ _\n\
      _ _ _ O O _ _ _\n\
      en mi matriz led\n\
  } Si no {\n\
    Dibujar\n\
      _ _ _ _ _ _ _ _\n\
      _ _ _ _ _ _ _ _\n\
      _ _ O _ _ O _ _\n\
      _ _ O _ _ O _ _\n\
      _ _ _ _ _ _ _ _\n\
      _ O _ _ _ _ O _\n\
      _ _ O O O O _ _\n\
      _ _ _ _ _ _ _ _\n\
      en mi matriz led\n\
  }\n\
}";
  Simu.IniciarConCódigo(Simu.textoInicial);
};

Simu.IniciarConCódigo = function(código) {
  // Ajustes
  let modoCódigo = Mila.Navegador.argumentoUrl('modoCodigo');
  if (modoCódigo.esAlgo()) {
    Simu.ajustes.modoCódigo = modoCódigo;
  }
  let modoVer = Mila.Navegador.argumentoUrl('modoVer');
  if (modoVer.esAlgo()) {
    Simu.ajustes.modoVer = modoVer;
  }
  let placa = Mila.Navegador.argumentoUrl('placa');
  if (placa.esAlgo()) {
    Simu.ajustes.placa = placa;
  }
  let setupPlaca = Mila.Navegador.argumentoUrl('setup');
  if (setupPlaca.esAlgo()) {
    setupPlaca = JSON.parse(setupPlaca);
  }

  // Crear UI
  Simu.areaTexto = Mila.Pantalla.nuevaAreaTexto({texto:código, editable:(Simu.ajustes.modoCódigo == "EDITAR")});
  let elementosEscritorio = [];
  if (["VER","EDITAR"].includes(Simu.ajustes.modoCódigo)) {
    elementosEscritorio.push(Mila.Pantalla.nuevoPanel({elementos:[Simu.areaTexto],ancho:300}));
  }
  Simu.panelDiseño = Simu.Diseño.Inicializar(Simu.ajustes.modoVer, Simu.ajustes.placa, setupPlaca);
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

  const elementosMenúSuperior = [Simu.botoneraEjecución];
  if (Simu.ajustes.modoVer == "PINES") {
    Simu.mostrarPinesDesconectados = Mila.Pantalla.nuevaCasillaVerificacion({
      funcion:Simu.Diseño.Actualizar
    });
    elementosMenúSuperior.ConcatenarCon_([
      Mila.Pantalla.nuevaEtiqueta({texto:"Mostrar pines desconectados"}),
      Simu.mostrarPinesDesconectados
    ]);
  }
  Simu.menuSuperior = Mila.Pantalla.nuevoPanel({disposicion:"Horizontal",
    alto:"Minimizar", elementos:elementosMenúSuperior
  });

  Simu.interprete = Simu.Interprete.nuevo(Simu.Lenguaje.mapaPrimitivas);

  Mila.Pantalla.nueva({elementos:[Simu.menuSuperior,Simu.escritorio]}, "Principal");
  Simu.Diseño.Actualizar();

  // Pantalla Boom
  Simu.etiquetaBoom = Mila.Pantalla.nuevaEtiqueta({texto:"-",ancho:"Maximizar"});
  Mila.Pantalla.nueva({elementos:[
    Mila.Pantalla.nuevoPanel({elementos:[
        Mila.Pantalla.nuevaEtiqueta({texto:"BOOM",ancho:"Maximizar"}),
        Simu.etiquetaBoom,
        Mila.Pantalla.nuevoPanel({elementos:[Mila.Pantalla.nuevoBoton({texto:"Aceptar",cssAdicional:{
          position:"static","margin-left":"auto","margin-right":"auto",display:"table"},
        funcion:Simu.CerrarPantallaBoom})]})
      ],ancho:"Maximizar",alto:"Maximizar"}
    ),
      Mila.Pantalla.nuevaImagen({ruta:Simu.rutaImagen("boom.png"),alto:"Maximizar",cssAdicional:{
        position:"static","margin-left":"auto","margin-right":"auto",display:"block"}
      })
    ],
    disposicion:Mila.Pantalla.DisposicionVerticalInvertida
  }, "Boom");
};

Simu.Boom = function(código) {
  Simu.EjecutarCódigo_(`${código}while(1){}`);
};

Simu.CerrarPantallaBoom = function() {
  Mila.Pantalla.CambiarA_("Principal");
  Simu.Diseño.AgregarListenersDeslizadores();
};

Simu.PantallaBoom = function(msg) {
  Simu.etiquetaBoom.CambiarTextoA_(msg);
  Mila.Pantalla.CambiarA_("Boom");
};

Simu.Ejecutar = function() {
  let código = Simu.areaTexto.texto();
  código = Simu.Parser.Parsear(código);
  if (código.esNada()) {
    return;
  }
  Simu.EjecutarCódigo_(código);
  Simu.botoneraEjecución.CambiarElementosA_(Simu.botonesEnEjecución());
};

Simu.Pausar = function() {
};

Simu.Detener = function() {
  Simu.interprete.Detener();
  Simu.Diseño.Reiniciar();
  Simu.botoneraEjecución.CambiarElementosA_(Simu.botonesDetenido());
};

Simu.Continuar = function() {
};

Simu.Reiniciar = function() {
  Simu.interprete.Detener();
  Simu.Diseño.Reiniciar();
  Simu.botoneraEjecución.CambiarElementosA_(Simu.botonesDetenido());
};

Simu.Finalizar = function() {
  Simu.interprete.Detener();
  Simu.botoneraEjecución.CambiarElementosA_(Simu.botonesFinalizado());
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

Simu.botonesFinalizado = function() {
  return [Simu.botonReiniciar];
};

Simu.DetenerInterpretePor_Milisegundos = function(cantidadMilisegundos) {
  Simu.interprete.Pausar();
  setTimeout(Simu.interprete.Continuar.bind(Simu.interprete), cantidadMilisegundos);
};

Simu.EjecutarCódigo_ = function(código) {
  console.log(código);
  Simu.interprete.CargarCodigo(código);
  Simu.interprete.Ejecutar();
}

Simu.rutaImagen = function(archivo) {
  // return `img/${archivo}`; // Local (desde src)
  return `../src/img/${archivo}`; // Web (desde build)
};