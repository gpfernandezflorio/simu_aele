Mila.Módulo({
  define:"Simu.Diseño",
  necesita:["$milascript/base"],
  usa:["$milascript/pantalla/todo","$milascript/audio","$milascript/geometria","componentes"]
});

Simu.Diseño.Inicializar = function(modo, placa, setupPlaca) {
  Mila.Contrato({
    Propósito: "Inicializar el módulo de diseño de simu-aele.",
    Parámetros: [
      [modo, Mila.Tipo.Texto], // Alguno de los modos válidos (PINES, MODULOS, ...)
      [placa, Mila.Tipo.Texto], // Alguna de las placas válidos (UNO, MEGA, NANO, ...)
      [setupPlaca] // Información de pines y módulos que llegan como argumento url.
        // Si es Mila.Nada, se usa la configuración por defecto (Simu.Diseño.pinesIO y Simu.Diseño.componentes).
    ]
  });
  Simu.Diseño.modo = modo;
  Simu.Diseño.placaActual = Simu.Diseño.placas[placa];
  if (setupPlaca.esAlgo()) {
    Simu.Diseño.pinesIO = setupPlaca.pinesIO;
    Simu.Diseño.componentes = setupPlaca.componentes;
  }
  Simu.Diseño.panel = Mila.Pantalla.nuevoPanel({grosorBorde:1, colorBorde:"#888"});
  Mila.Audio.EstablecerVolumenEn_(20);
  return Simu.Diseño.panel;
};

Simu.Diseño.Actualizar = function() {
  Mila.Contrato({
    Propósito: "Actualizar el módulo de diseño de simu-aele."
  });
  if (Simu.Diseño.modo == "PINES") {
    Simu.Diseño.DibujarPines();
  } else {
    Simu.Diseño.DibujarMódulos();
  }
  Mila.Pantalla._Redimensionar();
};

Simu.Diseño.Reiniciar = function() {
  Mila.Contrato({
    Propósito: "Reiniciar el módulo de diseño de simu-aele."
  });
  if (Simu.Diseño.modo == "PINES") {
    Simu.Diseño.ReiniciarValoresPines();
  } else {
    Simu.Diseño.ReiniciarValoresMódulos();
  }
  Mila.Pantalla._Redimensionar();
};

Simu.Diseño.pinesIO = {
  // TODO: En lugar de estar harcodeado, que se genere a partir del input del usuario.
  8:{modo:"ENTRADA", rango:"BINARIO"},
  9:{modo:"SALIDA", rango:"A256", valor:"-"},
  10:{modo:"SALIDA", rango:"BINARIO", valor:"-"},
  11:{modo:"ENTRADA", rango:"BINARIO"},
  12:{modo:"SALIDA", rango:"BINARIO", valor:"-"},
  A1:{modo:"SALIDA", rango:"BINARIO", valor:"-"},
  A3:{modo:"ENTRADA", rango:"BINARIO"},
  A4:{modo:"ENTRADA", rango:"A1024"}
};

Simu.Diseño.componentes = {
  // TODO: En lugar de estar harcodeado, que se genere a partir del input del usuario.
  UnoR3:{
    clase:"BOARD", modelo:"UNO_R3",
    ubicación:Mila.Geometria.puntoEn__(0,800)
  },
  LED_8:{
    clase:"LED", pin:8, modo: ['D','OUT'],
    ubicación:Mila.Geometria.puntoEn__(0,0)
  },
  'LED_MATRIX_mi matriz led':{
    clase:"LED_MATRIX", nombre:"mi matriz led", pines: [4, 7, 'A0'],
    ubicación:Mila.Geometria.puntoEn__(0,400)
  },
  LDR_5:{
    clase:"LDR", pin:5, modo: ['D','IN'],
    ubicación:Mila.Geometria.puntoEn__(300,0)
  },
  ULTRASONIC_3_6:{
    clase:"ULTRASONIC", echo:3, trigger:6,
    ubicación:Mila.Geometria.puntoEn__(300,400)
  },
  BUZZER_9:{
    clase:"BUZZER", pin:9,
    ubicación:Mila.Geometria.puntoEn__(600,0)
  },
  SERVO_10:{
    clase:"SERVO", pin:10,
    ubicación:Mila.Geometria.puntoEn__(600,400)
  }
};

Simu.Diseño.MoverCámara__ = function(x, y) {
  Mila.Contrato({
    Propósito: "Mover la cámara del escenario tanto como indiquen los desplazamientos dados en cada eje",
    Parámetros: [
      [x, Mila.Tipo.Entero],
      [y, Mila.Tipo.Entero]
    ],
    Precondiciones: [
      "El modo de visualización es Módulos",
      Simu.ajustes.modoVer == "MODULOS"
    ]
  });
  Simu.Diseño.escenario.MoverCámara__(x, y);
};

Simu.Diseño.DibujarPines = function() {
  Mila.Contrato({
    Propósito: "Dibujar el estado de los pines en el panel de diseño.",
    Precondiciones: [
      "El modo actual del simulador es Pines",
      Simu.Diseño.modo == "PINES"
    ]
  });
  const pines = [];
  for (let pin in Simu.mostrarPinesDesconectados.marcada()
    ? Simu.Diseño.placaActual.pines
    : Simu.Diseño.pinesIO
  ) {
    pines.push(Simu.Diseño.panelParaPin_(pin));
  }
  Simu.Diseño.panel.CambiarElementosA_(pines);
};

Simu.Diseño.InicializarMódulos = function() {
  Mila.Contrato({
    Propósito: "Inicializar el estado de los componentes.",
    Precondiciones: [
      "El modo actual del simulador es MODULOS",
      Simu.Diseño.modo == "MODULOS"
    ]
  });
  Simu.Diseño.componentes.valoresContenidos().conCadaUno(componente => {
    componente.componente = Simu.Componentes.nuevo(componente);
  });
};

Simu.Diseño.DibujarMódulos = function() {
  Mila.Contrato({
    Propósito: "Dibujar el estado de los componentes en el panel de diseño.",
    Precondiciones: [
      "El modo actual del simulador es MODULOS",
      Simu.Diseño.modo == "MODULOS"
    ]
  });
  const contenido = [];
  Simu.Diseño.componentes.valoresContenidos().conCadaUno(componente => {
    contenido.push({
      x:() => componente.componente.ubicación().x,
      y:() => componente.componente.ubicación().y,
      imagen: () => {
        return {clase:'svg', svg:componente.componente.svg()};
      }
    });
  });
  const escena = Mila.Escena.nueva({contenido});
  const cámara = Mila.Cámara.nueva({zoom:25});
  Simu.Diseño.escenario = Mila.Pantalla.nuevoEscenario({cámara, escena});
  Simu.Diseño.panel.CambiarElementosA_(Simu.Diseño.escenario);
};

Simu.Diseño.AgregarListenersDeslizadores = function() {
  // TODO: esto lo pongo acá por ahora. Más adelante, que sea parte del código de inicialización de elementos de Pantalla
    // (en la función Simu.Diseño.panelParaModulo_). Hay que modificar el deslizador para que tome una función que se ejecute al
    // soltar.
  for (let claveModulo in Simu.Diseño.componentes) {
    if ('deslizador' in Simu.Diseño.componentes[claveModulo]) {
      Simu.Diseño.componentes[claveModulo].deslizador._nodoHtml.addEventListener('input', function() {
        let valor = Simu.Diseño.componentes[claveModulo].deslizador.valor();
        let unidad = {
          'LDR':'%',
          'ULTRASONIC':' cm'
        }[Simu.Diseño.componentes[claveModulo].clase];
        if ('etiqueta' in Simu.Diseño.componentes[claveModulo]) {
          Simu.Diseño.componentes[claveModulo].etiqueta.CambiarTextoA_(`${valor}${unidad}`);
        }
      });
    }
  }
};

Simu.Diseño.panelParaPin_ = function(pin) {
  Mila.Contrato({
    Propósito: [
      "Describe un nuevo panel para mostrar en el panel de diseño que refleje el estado del pin dado.",
      Mila.Tipo.Panel
    ],
    Parámetros: [
      [pin, Mila.Tipo.Texto]
    ]
  });
  const estáConectado = pin in Simu.Diseño.pinesIO;
  const botonConexion = Mila.Pantalla.nuevoBoton({texto:estáConectado ? "Desconectar" : "Conectar"});
  const panelIzquierdo = Mila.Pantalla.nuevoPanel({alto:"Minimizar",disposicion:"Horizontal"});
  const panelMedio = Mila.Pantalla.nuevoPanel({alto:"Minimizar",disposicion:"Horizontal"});
  const panelDerecho = Mila.Pantalla.nuevoPanel({alto:"Minimizar",disposicion:"Horizontal"});
  panelIzquierdo.AgregarElemento_(Mila.Pantalla.nuevaEtiqueta({texto:pin,ancho:60}));
  if (estáConectado) {
    const esEntrada = Simu.Diseño.pinesIO[pin].modo == "ENTRADA";
    const esDigital = Simu.Diseño.pinesIO[pin].rango == "BINARIO";
    panelIzquierdo.AgregarElemento_(Mila.Pantalla.nuevaEtiqueta({texto:"Modo:"}));
    panelIzquierdo.AgregarElemento_(Mila.Pantalla.nuevoBoton({texto:esEntrada ? "Entrada" : "Salida"}));
    panelIzquierdo.AgregarElemento_(Mila.Pantalla.nuevoBoton({texto:esDigital
      ? "Digital"
      : (Simu.Diseño.pinesIO[pin].rango == "A256" ? "Pwm" : "Analógica")
    }));
    if (esEntrada) {
      if (esDigital) {
        panelMedio.AgregarElemento_(Mila.Pantalla.nuevaCasillaVerificacion({ancho:"Maximizar"}));
      } else {
        panelMedio.AgregarElemento_(Mila.Pantalla.nuevoDeslizador({ancho:"Maximizar"}));
      }
    } else {
      const etiquetaValor = Mila.Pantalla.nuevaEtiqueta({texto:Simu.Diseño.pinesIO[pin].valor,ancho:"Maximizar"});
      Simu.Diseño.pinesIO[pin].etiqueta = etiquetaValor;
      panelMedio.AgregarElemento_(etiquetaValor);
    }
    panelDerecho.AgregarElemento_(botonConexion);
  } else {
    panelIzquierdo.AgregarElemento_(Mila.Pantalla.nuevaEtiqueta({texto:"(desconectado)"}));
    panelMedio.AgregarElemento_(botonConexion);
  }
  return Mila.Pantalla.nuevoPanel({elementos:[panelIzquierdo,panelMedio,panelDerecho],alto:"Minimizar",disposicion:"Horizontal"});
};

Simu.Diseño.Escribir = function(pin, valor) {
  Mila.Contrato({
    Propósito:"Actualizar el panel de diseño para reflejar que se escribió el valor dado en el pin dado.",
    Parámetros: [
      [pin, Mila.Tipo.Texto],
      [valor, Mila.Tipo.O([Mila.Tipo.Numero, Mila.Tipo.Texto])]
    ]
  });
  if (valor.esUnNumero()) {
    if (valor < 0) {
      Simu.Diseño.BOOM("No se puede escribir un valor negativo en un pin pwm.");
      return;
    } else if (valor > 255) {
      Simu.Diseño.BOOM("No se puede escribir un valor mayor a 255 en un pin pwm.");
      return;
    }
  }
  if (Simu.Diseño.modo == "PINES") {
    Simu.Diseño.AsignarValorPin(pin, valor);
    Mila.Pantalla._Redimensionar();
  } else if (Simu.Diseño.modo == "MODULOS") {
    let claveModulo = `PIN_${pin}`;
    if (claveModulo in Simu.Diseño.componentes && 'componente' in Simu.Diseño.componentes[claveModulo]) {
      // TODO
      // Simu.Diseño.componentes[claveModulo].componente.AsignarValor_(valor);
    }
  }
};

Simu.Diseño.lecturaDigital = function(pin) {
  // TODO
};

Simu.Diseño.lecturaAnalogica = function(pin) {
  // TODO
};

Simu.Diseño.distancia = function(echo, trigger) {
  Mila.Contrato({
    Propósito:[
      "Describir la distancia medida por el sonar del panel de diseño conectado a los pines dados.",
      Mila.Tipo.Numero
    ],
    Parámetros: [
      [echo, Mila.Tipo.Texto],
      [trigger, Mila.Tipo.Texto]
    ]
  });
  let claveModulo = `ULTRASONIC_${echo}_${trigger}`;
  if (claveModulo in Simu.Diseño.componentes && 'componente' in Simu.Diseño.componentes[claveModulo]) {
    // TODO
    // return Simu.Diseño.componentes[claveModulo].componente.distancia();
  }
  return 0;
};

Simu.Diseño.estáOscuro = function(pin) {
  Mila.Contrato({
    Propósito:[
      "Indicar si el nivel de luz medido por el ldr del panel de diseño conectado al pin dado es suficientemente alto como para considerar que está oscuro.",
      Mila.Tipo.Booleano
    ],
    Parámetros: [
      [pin, Mila.Tipo.Texto]
    ]
  });
  let claveModulo = `LDR_${pin}`;
  if (claveModulo in Simu.Diseño.componentes && 'componente' in Simu.Diseño.componentes[claveModulo]) {
    // TODO
    // let valor = Simu.Diseño.componentes[claveModulo].componente.nivelDeLuz();
    // return valor > 500; // ¿De dónde sacar este valor? ¿Ponerle un tornillo al módulo con el que se pueda interactuar?
  }
  return false;
};

Simu.Diseño.luminosidad = function(pin, intensidad) {
  Mila.Contrato({
    Propósito:[
      "Describe el nivel de luz medido por el ldr del panel de diseño conectado al pin dado.",
      Mila.Tipo.Numero
    ],
    Parámetros: [
      [pin, Mila.Tipo.Texto],
      [intensidad, Mila.Tipo.Texto] // PORCENTAJE o RAW
    ]
  });
  let claveModulo = `LDR_${pin}`;
  if (claveModulo in Simu.Diseño.componentes && 'componente' in Simu.Diseño.componentes[claveModulo]) {
    // TODO
    // let valor = Simu.Diseño.componentes[claveModulo].componente.nivelDeLuz();
    // if (intensidad == 'PORCENTAJE') {
    //   return valor;
    // } // RAW
    // return Math.round((100 - valor)*10.24);
  }
  return 0;
};

Simu.Diseño.Esperar = function(cantidadMilisegundos) {
  Mila.Contrato({
    Propósito:"Simula una espera en la ejecución con la cantidad de milisegundos dada.",
    Parámetros: [
      [cantidadMilisegundos, Mila.Tipo.Numero]
    ]
  });
  if (cantidadMilisegundos < 0) {
    Simu.Diseño.BOOM("No se puede esperar una cantidad negativa de tiempo.");
  } else {
    Simu.DetenerInterpretePor_Milisegundos(cantidadMilisegundos);
  }
};

Simu.Diseño.Decir = function(mensaje) {
  Mila.Contrato({
    Propósito:"Actualizar el panel de diseño para reflejar que se escribió texto en el monitor serial.",
    Parámetros: [
      [mensaje, Mila.Tipo.Texto]
    ]
  });
  if (Simu.Diseño.modo == "MODULOS") { // TODO: Pensar cómo manejar esto. Suena cómodo que este sí sea un área de texto en lugar de un svg.
    // let claveModulo = "MONITOR";
    // if (claveModulo in Simu.Diseño.componentes && 'areaTexto' in Simu.Diseño.componentes[claveModulo]) {
    //   Simu.Diseño.componentes[claveModulo].areaTexto.CambiarTextoA_(
    //     Simu.Diseño.componentes[claveModulo].areaTexto.texto() + "\n" + mensaje
    //   );
    //   if ('autoscroll' in Simu.Diseño.componentes[claveModulo] && Simu.Diseño.componentes[claveModulo].autoscroll.marcada()) {
    //     const nodoHtml = Simu.Diseño.componentes[claveModulo].areaTexto._nodoHtml;
    //     nodoHtml.scrollTo(nodoHtml.scrollLeft, nodoHtml.scrollHeight);
    //   }
    // }
  }
};

Simu.Diseño.FinalizarEjecución = function() {
  Mila.Contrato({
    Propósito:"Actualizar el panel de diseño para reflejar que se finalizó la ejecución."
  });
  Simu.Finalizar();
};

Simu.Diseño.BOOM = function(mensaje) {
  Mila.Contrato({
    Propósito:"Actualizar el panel de diseño para reflejar que se produjo un error en la ejecución.",
    Parámetros: [
      [mensaje, Mila.Tipo.Texto]
    ]
  });
  let boom = Simu.Parser.Boom();
  if (boom.esAlgo()) {
    Simu.Boom(boom);
  } else {
    Simu.PantallaBoom(mensaje);
    Simu.Finalizar();
  }
};

Simu.Diseño.SetLed = function(pin, valor, intensidad) {
  Mila.Contrato({
    Propósito:"Actualizar el panel de diseño para reflejar que un led conectado al pin dado se encendió con el valor dado y la intensidad dada.",
    Parámetros: [
      [pin, Mila.Tipo.Texto],
      [valor, Mila.Tipo.O[Mila.Tipo.Texto, Mila.Tipo.Numero]],
      [intensidad, Mila.Tipo.Texto] // BINARIA, PORCENTAJE o RAW
    ]
  });
  if (intensidad == "PORCENTAJE") {
    if (valor < 0) {
      Simu.Diseño.BOOM("No se puede asignar un valor negativo como porcentaje de intensidad de un led.");
      return;
    } else if (valor > 100) {
      Simu.Diseño.BOOM("No se puede asignar un valor mayor a 100 como porcentaje de intensidad de un led.");
      return;
    }
  } else if (intensidad == "RAW") {
    if (valor < 0) {
      Simu.Diseño.BOOM("No se puede asignar un valor negativo como intensidad de un led.");
      return;
    } else if (valor > 255) {
      Simu.Diseño.BOOM("No se puede asignar un valor mayor a 255 como intensidad de un led.");
      return;
    }
  }
  if (Simu.Diseño.modo == "PINES") {
    Simu.Diseño.AsignarValorPin(pin,
      (intensidad == "PORCENTAJE" ? Math.round(valor*2.55) : valor)
    );
    Mila.Pantalla._Redimensionar();
  } else if (Simu.Diseño.modo == "MODULOS") {
    let claveModulo = `LED_${pin}`;
    if (claveModulo in Simu.Diseño.componentes && 'componente' in Simu.Diseño.componentes[claveModulo]) {
      // TODO
      // Simu.Diseño.componentes[claveModulo].componente.EstablecerValorEn_(...);
    }
  }
};

Simu.Diseño.EncenderBuzzer = function(pin) {
  Mila.Contrato({
    Propósito:"Actualizar el panel de diseño para reflejar que un buzzer conectado al pin dado se encendió.",
    Parámetros: [
      [pin, Mila.Tipo.Texto]
    ]
  });
  if (Simu.Diseño.modo == "PINES") {
    Simu.Diseño.AsignarValorPin(pin, "HIGH");
    Mila.Pantalla._Redimensionar();
  } else if (Simu.Diseño.modo == "MODULOS") {
    let claveModulo = `BUZZER_${pin}`;
    Mila.Audio.Reproducir(Mila.Audio.nota("Do"));
  }
};

Simu.Diseño.ApagarBuzzer = function(pin) {
  Mila.Contrato({
    Propósito:"Actualizar el panel de diseño para reflejar que un buzzer conectado al pin dado se apagó.",
    Parámetros: [
      [pin, Mila.Tipo.Texto]
    ]
  });
  if (Simu.Diseño.modo == "PINES") {
    Simu.Diseño.AsignarValorPin(pin, "LOW");
    Mila.Pantalla._Redimensionar();
  } else if (Simu.Diseño.modo == "MODULOS") {
    let claveModulo = `BUZZER_${pin}`;
    Mila.Audio.Detener();
  }
};

Simu.Diseño.PosicionarServo = function(pin, ángulo) {
  Mila.Contrato({
    Propósito:"Actualizar el panel de diseño para reflejar que un servo conectado al pin dado se posicionó en el ángulo dado.",
    Parámetros: [
      [pin, Mila.Tipo.Texto],
      [ángulo, Mila.Tipo.Numero]
    ]
  });
  if (Simu.Diseño.modo == "PINES") {
    //
  } else if (Simu.Diseño.modo == "MODULOS") {
    let claveModulo = `SERVO_${pin}`;
    if (claveModulo in Simu.Diseño.componentes && 'componente' in Simu.Diseño.componentes[claveModulo]) {
      // TODO
      // Simu.Diseño.componentes[claveModulo].componente.CambiarRotaciónA_(angulo);
    }
  }
};

Simu.Diseño.DibujarMatrizLed = function(dibujo, nombre) {
  Mila.Contrato({
    Propósito:"Actualizar el panel de diseño para reflejar que se dibujó el dibujo dado en una matriz de leds con el nombre dado.",
    Parámetros: [
      [dibujo, Mila.Tipo.ListaDe_(Mila.Tipo.Texto)],
      [nombre, Mila.Tipo.Texto]
    ]
  });
  if (Simu.Diseño.modo == "MODULOS") {
    let claveModulo = `LED_MATRIX_${nombre}`;
    if (claveModulo in Simu.Diseño.componentes && 'componente' in Simu.Diseño.componentes[claveModulo]) {
      for (let i=0; i<64; i++) {
        if (dibujo.length > i && Simu.Diseño.componentes[claveModulo].componente.length > i) {
          // TODO
          // Simu.Diseño.componentes[claveModulo].componente.EstablecerLed_En_(i,
          //   dibujo[i] == "O" ? "ON" : "OFF"
          // );
        }
      }
    }
  }
};

Simu.Diseño.AsignarValorPin = function(pin, valor) {
  Mila.Contrato({
    Propósito:"Actualizar el panel de diseño para reflejar que se asignó el valor dado en el pin dado.",
    Parámetros: [
      [pin, Mila.Tipo.Texto],
      [valor, Mila.Tipo.O([Mila.Tipo.Texto, Mila.Tipo.Numero])]
    ],
    Precondiciones: [
      "El modo de visualización es Pines",
      Simu.ajustes.modoVer == "PINES"
    ]
  });
  if (pin in Simu.Diseño.pinesIO && 'etiqueta' in Simu.Diseño.pinesIO[pin]) {
    Simu.Diseño.pinesIO[pin].valor = valor;
    Simu.Diseño.pinesIO[pin].etiqueta.CambiarTextoA_(valor);
  }
};

Simu.Diseño.ReiniciarValoresPines = function() {
  Mila.Contrato({
    Propósito:"Actualizar el panel de diseño reiniciando los valores de todos los pines.",
    Precondiciones: [
      "El modo de visualización es Pines",
      Simu.ajustes.modoVer == "PINES"
    ]
  });
  for (let pin in Simu.Diseño.pinesIO) {
    Simu.Diseño.pinesIO[pin].valor = "-";
    if ('etiqueta' in Simu.Diseño.pinesIO[pin]) {
      Simu.Diseño.pinesIO[pin].etiqueta.CambiarTextoA_("-");
    }
  }
};

Simu.Diseño.ReiniciarValoresMódulos = function() {
  Mila.Contrato({
    Propósito:"Actualizar el panel de diseño reiniciando los valores de todos los componentes.",
    Precondiciones: [
      "El modo de visualización es Módulos",
      Simu.ajustes.modoVer == "MODULOS"
    ]
  });
  for (let claveModulo in Simu.Diseño.componentes) {
    const modulo = Simu.Diseño.componentes[claveModulo];
    if (modulo.defineLaClave_('componente') && modulo.componente.sabeResponder_('Reiniciar')) {
      // TODO
      // modulo.componente.Reiniciar();
    }
  }
};

Simu.Diseño.placas = {
  UNO:{
    pines:{
      0:{analógico:false, pwm:false},
      1:{analógico:false, pwm:false},
      2:{analógico:false, pwm:false},
      3:{analógico:false, pwm:true},
      4:{analógico:false, pwm:false},
      5:{analógico:false, pwm:true},
      6:{analógico:false, pwm:true},
      7:{analógico:false, pwm:false},
      8:{analógico:false, pwm:false},
      9:{analógico:false, pwm:true},
      10:{analógico:false, pwm:true},
      11:{analógico:false, pwm:true},
      12:{analógico:false, pwm:false},
      13:{analógico:false, pwm:false},
      A0:{analógico:true, pwm:false},
      A1:{analógico:true, pwm:false},
      A2:{analógico:true, pwm:false},
      A3:{analógico:true, pwm:false},
      A4:{analógico:true, pwm:false},
      A5:{analógico:true, pwm:false}
    }
  },
  MEGA:{
    pines:{
      0:{analógico:false, pwm:false},
      1:{analógico:false, pwm:false},
      2:{analógico:false, pwm:true},
      3:{analógico:false, pwm:true},
      4:{analógico:false, pwm:true},
      5:{analógico:false, pwm:true},
      6:{analógico:false, pwm:true},
      7:{analógico:false, pwm:true},
      8:{analógico:false, pwm:true},
      9:{analógico:false, pwm:true},
      10:{analógico:false, pwm:true},
      11:{analógico:false, pwm:true},
      12:{analógico:false, pwm:true},
      13:{analógico:false, pwm:true},
      14:{analógico:false, pwm:false},
      15:{analógico:false, pwm:false},
      16:{analógico:false, pwm:false},
      17:{analógico:false, pwm:false},
      18:{analógico:false, pwm:false},
      19:{analógico:false, pwm:false},
      20:{analógico:false, pwm:false},
      21:{analógico:false, pwm:false},
      22:{analógico:false, pwm:false},
      23:{analógico:false, pwm:false},
      24:{analógico:false, pwm:false},
      25:{analógico:false, pwm:false},
      26:{analógico:false, pwm:false},
      27:{analógico:false, pwm:false},
      28:{analógico:false, pwm:false},
      29:{analógico:false, pwm:false},
      30:{analógico:false, pwm:false},
      31:{analógico:false, pwm:false},
      32:{analógico:false, pwm:false},
      33:{analógico:false, pwm:false},
      34:{analógico:false, pwm:false},
      35:{analógico:false, pwm:false},
      36:{analógico:false, pwm:false},
      37:{analógico:false, pwm:false},
      38:{analógico:false, pwm:false},
      39:{analógico:false, pwm:false},
      40:{analógico:false, pwm:false},
      41:{analógico:false, pwm:false},
      42:{analógico:false, pwm:false},
      43:{analógico:false, pwm:false},
      44:{analógico:false, pwm:true},
      45:{analógico:false, pwm:true},
      46:{analógico:false, pwm:true},
      47:{analógico:false, pwm:false},
      48:{analógico:false, pwm:false},
      49:{analógico:false, pwm:false},
      50:{analógico:false, pwm:false},
      51:{analógico:false, pwm:false},
      52:{analógico:false, pwm:false},
      53:{analógico:false, pwm:false},
      A0:{analógico:true, pwm:false},
      A1:{analógico:true, pwm:false},
      A2:{analógico:true, pwm:false},
      A3:{analógico:true, pwm:false},
      A4:{analógico:true, pwm:false},
      A5:{analógico:true, pwm:false},
      A6:{analógico:true, pwm:false},
      A7:{analógico:true, pwm:false},
      A8:{analógico:true, pwm:false},
      A9:{analógico:true, pwm:false},
      A10:{analógico:true, pwm:false},
      A11:{analógico:true, pwm:false},
      A12:{analógico:true, pwm:false},
      A13:{analógico:true, pwm:false},
      A14:{analógico:true, pwm:false},
      A15:{analógico:true, pwm:false}
    }
  },
  NANO:{
    pines:{
      0:{analógico:false, pwm:false},
      1:{analógico:false, pwm:false},
      2:{analógico:false, pwm:false},
      3:{analógico:false, pwm:true},
      4:{analógico:false, pwm:false},
      5:{analógico:false, pwm:true},
      6:{analógico:false, pwm:true},
      7:{analógico:false, pwm:false},
      8:{analógico:false, pwm:false},
      9:{analógico:false, pwm:true},
      10:{analógico:false, pwm:true},
      11:{analógico:false, pwm:true},
      12:{analógico:false, pwm:false},
      13:{analógico:false, pwm:false},
      A0:{analógico:true, pwm:false},
      A1:{analógico:true, pwm:false},
      A2:{analógico:true, pwm:false},
      A3:{analógico:true, pwm:false},
      A4:{analógico:true, pwm:false},
      A5:{analógico:true, pwm:false},
      A6:{analógico:true, pwm:false},
      A7:{analógico:true, pwm:false}
    }
  }
};