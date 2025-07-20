Mila.Modulo({
  define:"Simu.Diseño",
  necesita:["$milascript/base"],
  usa:["$milascript/pantalla"]
});

Simu.Diseño.Inicializar = function(modo, placa, setupPlaca) {
  Simu.Diseño.modo = modo;
  Simu.Diseño.placaActual = Simu.Diseño.placas[placa];
  if (setupPlaca.esAlgo()) {
    Simu.Diseño.pinesIO = setupPlaca.pinesIO;
    Simu.Diseño.componentes = setupPlaca.componentes;
  }
  Simu.Diseño.panel = Mila.Pantalla.nuevoPanel();
  return Simu.Diseño.panel;
};

Simu.Diseño.Actualizar = function() {
  if (Simu.Diseño.modo == "PINES") {
    Simu.Diseño.DibujarPines();
  } else {
    Simu.Diseño.DibujarModulos();
  }
  Mila.Pantalla._Redimensionar();
};

Simu.Diseño.Reiniciar = function() {
  if (Simu.Diseño.modo == "PINES") {
    Simu.Diseño.ReiniciarValoresPines();
  } else {
    Simu.Diseño.ReiniciarValoresMódulos();
  }
  Mila.Pantalla._Redimensionar();
};

Simu.Diseño.pinesIO = {
  // 8:{modo:"ENTRADA", rango:"BINARIO"},
  // 9:{modo:"SALIDA", rango:"A256", valor:"-"},
  // 10:{modo:"SALIDA", rango:"BINARIO", valor:"-"},
  // 11:{modo:"ENTRADA", rango:"BINARIO"},
  // 12:{modo:"SALIDA", rango:"BINARIO", valor:"-"},
  // A1:{modo:"SALIDA", rango:"BINARIO", valor:"-"},
  // A3:{modo:"ENTRADA", rango:"BINARIO"},
  // A4:{modo:"ENTRADA", rango:"A1024"}
};

Simu.Diseño.componentes = {
  LED_8:{componente:"LED", pin:8, modo: ['D','OUT']},
  'LED_MATRIX_mi matriz led':{componente:"LED_MATRIX", nombre:"mi matriz led", pines: [4, 7, 'A0']},
  LDR_5:{componente:"LDR", pin:5, modo: ['D','IN']},
  ULTRASONIC_3_6:{componente:"ULTRASONIC", echo:3, trigger:6}
};

Simu.Diseño.DibujarPines = function() {  
  const pines = [];
  for (let pin in Simu.mostrarPinesDesconectados.marcada()
    ? Simu.Diseño.placaActual.pines
    : Simu.Diseño.pinesIO
  ) {
    pines.push(Simu.Diseño.panelParaPin_(pin));
  }
  Simu.Diseño.panel.CambiarElementosA_(pines);
};

Simu.Diseño.DibujarModulos = function() {
  let módulosPorLínea = 2;
  const líneas = [];
  let módulos = [];
  for (let claveMódulo in Simu.Diseño.componentes) {
    if (módulos.length == módulosPorLínea) {
      líneas.push(Mila.Pantalla.nuevoPanel({disposicion:"Horizontal",alto:"Minimizar",elementos:módulos}));
      módulos = [];
    }
    módulos.push(Simu.Diseño.panelParaModulo_(claveMódulo));
  }
  líneas.push(Mila.Pantalla.nuevoPanel({disposicion:"Horizontal",alto:"Minimizar",elementos:módulos}));
  Simu.Diseño.panel.CambiarElementosA_(líneas);
};

Simu.Diseño.panelParaPin_ = function(pin) {
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

Simu.Diseño.panelParaModulo_ = function(claveModulo) {
  let ancho;
  const modulo = Simu.Diseño.componentes[claveModulo];
  switch (modulo.componente) {
    case "PIN":
      modulo.imagen = Mila.Pantalla.nuevaEtiqueta({texto:"-"});
      return Mila.Pantalla.nuevoPanel({elementos:[
        Mila.Pantalla.nuevaEtiqueta({texto:`pin ${modulo.pin} (${
          modulo.modo[1] == 'IN' ? "entrada" : "salida"
        } ${
          modulo.modo[0] == 'D' ? "digital" : "analógica"
        }) : `}),
        modulo.imagen
      ],ancho:"Minimizar",alto:"Minimizar",disposicion:"Horizontal",
        margenExterno:10,margenInterno:10,colorBorde:'#000'
      });
    case "LED":
      ancho = 80;
      modulo.imagen = Mila.Pantalla.nuevaImagen({ruta:Simu.rutaImagen("ledApagada.svg"),ancho});
      return Mila.Pantalla.nuevoPanel({elementos:[
        modulo.imagen,
        Mila.Pantalla.nuevaEtiqueta({texto:`pin ${modulo.pin}`,ancho,tamanioLetra:10})
      ],ancho:"Minimizar",alto:"Minimizar",
        margenExterno:10,margenInterno:10,colorBorde:'#000'
      });
    case "BUZZER":
      modulo.imagen = Mila.Pantalla.nuevaEtiqueta({texto:"Imagen de un buzzer apagado"});
      return Mila.Pantalla.nuevoPanel({elementos:[
        modulo.imagen,
        Mila.Pantalla.nuevaEtiqueta({texto:`. (pin ${modulo.pin})`,tamanioLetra:10})
      ],ancho:"Minimizar",alto:"Minimizar",disposicion:"Horizontal",
        margenExterno:10,margenInterno:10,colorBorde:'#000'
      });
    case "LED_MATRIX":
      Simu.Diseño.CrearPanelParaMatrizLed(modulo);
      return modulo.panel;
    case "ULTRASONIC":
      ancho = 180;
      modulo.etiqueta = Mila.Pantalla.nuevaEtiqueta({texto:'50 cm',ancho});
      modulo.deslizador = Mila.Pantalla.nuevoDeslizador({ancho});
      return Mila.Pantalla.nuevoPanel({elementos:[
        Mila.Pantalla.nuevaImagen({ruta:Simu.rutaImagen("sonar.svg"),ancho}),
        modulo.etiqueta,
        modulo.deslizador,
        Mila.Pantalla.nuevaEtiqueta({texto:`ECHO: ${modulo.echo}    TRIGGER: ${modulo.trigger}`,ancho,tamanioLetra:10})
      ],ancho:"Minimizar",alto:"Minimizar",
        margenExterno:10,margenInterno:10,colorBorde:'#000'
      });
    case "LDR":
      ancho = 150;
      modulo.etiqueta = Mila.Pantalla.nuevaEtiqueta({texto:'50 %',ancho});
      modulo.deslizador = Mila.Pantalla.nuevoDeslizador();
      return Mila.Pantalla.nuevoPanel({elementos:[
        Mila.Pantalla.nuevaImagen({ruta:Simu.rutaImagen("ldr.svg"),ancho}),
        modulo.etiqueta,
        modulo.deslizador,
        Mila.Pantalla.nuevaEtiqueta({texto:`pin ${modulo.pin}`,ancho,tamanioLetra:10})
      ],ancho:"Minimizar",alto:"Minimizar",
        margenExterno:10,margenInterno:10,colorBorde:'#000'
      });
    default:
      return Mila.Pantalla.nuevoPanel();
  }
};

Simu.Diseño.CrearPanelParaMatrizLed = function(modulo) {
  let anchoLed = 15;
  let margenLed = 2;
  let anchoTotal = (anchoLed + 2*margenLed)*8;
  modulo.imagen = [];
  let filas = [];
  filas.push(Mila.Pantalla.nuevaEtiqueta({texto:modulo.nombre,ancho:anchoTotal}));
  for (let i=1; i<=8; i++) {
    let fila = [];
    for (let j=1; j<=8; j++) {
      let imagen = Mila.Pantalla.nuevaImagen({ruta:Simu.rutaImagen("ledMatrizApagada.svg"),
        margenExterno:Mila.Geometria.rectanguloEn__De_x_(margenLed,0,margenLed,0),
        ancho:anchoLed
      });
      modulo.imagen.push(imagen);
      fila.push(imagen);
    }
    filas.push(Mila.Pantalla.nuevoPanel({elementos:fila,
      disposicion:"Horizontal",ancho:"Minimizar",alto:"Minimizar",
      colorFondo:"#000"
    }));
  }
  filas.push(Mila.Pantalla.nuevaEtiqueta({texto:
    `DIN: ${modulo.pines[0]}    CS: ${modulo.pines[1]}    CLK: ${modulo.pines[2]}`,ancho:anchoTotal,
    tamanioLetra:10,margenExterno:Mila.Geometria.rectanguloEn__De_x_(0,10,0,-10)
  }));
  modulo.panel = Mila.Pantalla.nuevoPanel({elementos:filas,ancho:"Minimizar",alto:"Minimizar",
    grosorBorde:2,colorBorde:'#000',margenInterno:10,margenExterno:10
  });
};

Simu.Diseño.Escribir = function(pin, valor) {
  if (Simu.Diseño.modo == "PINES") {
    Simu.Diseño.AsignarValorPin(pin, valor);
  } else if (Simu.Diseño.modo == "MODULOS") {
    let claveModulo = `PIN_${pin}`;
    if (claveModulo in Simu.Diseño.componentes && 'imagen' in Simu.Diseño.componentes[claveModulo]) {
      Simu.Diseño.componentes[claveModulo].imagen.CambiarTextoA_(valor);
    }
  }
  Mila.Pantalla._Redimensionar();
};

Simu.Diseño.lecturaDigital = function(pin) {

};

Simu.Diseño.lecturaAnalogica = function(pin) {

};

Simu.Diseño.distancia = function(echo, trigger) {
  let claveModulo = `ULTRASONIC_${echo}_${trigger}`;
  if (claveModulo in Simu.Diseño.componentes && 'deslizador' in Simu.Diseño.componentes[claveModulo]) {
    let valor = Simu.Diseño.componentes[claveModulo].deslizador.valor();
    if ('etiqueta' in Simu.Diseño.componentes[claveModulo]) {
      Simu.Diseño.componentes[claveModulo].etiqueta.CambiarTextoA_(`${valor} cm`);
    }
    return valor;
  }
  return 0;
};

Simu.Diseño.estáOscuro = function(pin) {
  let claveModulo = `LDR_${pin}`;
  if (claveModulo in Simu.Diseño.componentes && 'deslizador' in Simu.Diseño.componentes[claveModulo]) {
    let valor = Simu.Diseño.componentes[claveModulo].deslizador.valor();
    if ('etiqueta' in Simu.Diseño.componentes[claveModulo]) {
      Simu.Diseño.componentes[claveModulo].etiqueta.CambiarTextoA_(`${valor} %`);
    }
    return valor < 50;
  }
  return false;
};

Simu.Diseño.luminosidad = function(pin, intensidad) {
  let claveModulo = `LDR_${pin}`;
  if (claveModulo in Simu.Diseño.componentes && 'deslizador' in Simu.Diseño.componentes[claveModulo]) {
    let valor = Simu.Diseño.componentes[claveModulo].deslizador.valor();
    if ('etiqueta' in Simu.Diseño.componentes[claveModulo]) {
      Simu.Diseño.componentes[claveModulo].etiqueta.CambiarTextoA_(`'${valor}'`);
    }
    if (intensidad == 'PERCENT') {
      return valor;
    }
    // RAW
    return (100 - valor)*10.24;
  }
  return 0;
};

Simu.Diseño.EncenderLed = function(pin) {
  if (Simu.Diseño.modo == "PINES") {
    Simu.Diseño.AsignarValorPin(pin, "HIGH");
  } else if (Simu.Diseño.modo == "MODULOS") {
    let claveModulo = `LED_${pin}`;
    if (claveModulo in Simu.Diseño.componentes && 'imagen' in Simu.Diseño.componentes[claveModulo]) {
      Simu.Diseño.componentes[claveModulo].imagen.CambiarRutaA_(Simu.rutaImagen("ledPrendida.svg"));
    }
  }
  Mila.Pantalla._Redimensionar();
};

Simu.Diseño.ApagarLed = function(pin) {
  if (Simu.Diseño.modo == "PINES") {
    Simu.Diseño.AsignarValorPin(pin, "LOW");
  } else if (Simu.Diseño.modo == "MODULOS") {
    let claveModulo = `LED_${pin}`;
    if (claveModulo in Simu.Diseño.componentes && 'imagen' in Simu.Diseño.componentes[claveModulo]) {
      Simu.Diseño.componentes[claveModulo].imagen.CambiarRutaA_(Simu.rutaImagen("ledApagada.svg"));
    }
  }
  Mila.Pantalla._Redimensionar();
};

Simu.Diseño.EncenderBuzzer = function(pin) {
  if (Simu.Diseño.modo == "PINES") {
    Simu.Diseño.AsignarValorPin(pin, "HIGH");
  } else if (Simu.Diseño.modo == "MODULOS") {
    let claveModulo = `BUZZER_${pin}`;
    if (claveModulo in Simu.Diseño.componentes && 'imagen' in Simu.Diseño.componentes[claveModulo]) {
      Simu.Diseño.componentes[claveModulo].imagen.CambiarTextoA_("Imagen de un buzzer encendido");
    }
  }
  Mila.Pantalla._Redimensionar();
};

Simu.Diseño.ApagarBuzzer = function(pin) {
  if (Simu.Diseño.modo == "PINES") {
    Simu.Diseño.AsignarValorPin(pin, "LOW");
  } else if (Simu.Diseño.modo == "MODULOS") {
    let claveModulo = `BUZZER_${pin}`;
    if (claveModulo in Simu.Diseño.componentes && 'imagen' in Simu.Diseño.componentes[claveModulo]) {
      Simu.Diseño.componentes[claveModulo].imagen.CambiarTextoA_("Imagen de un buzzer apagado");
    }
  }
  Mila.Pantalla._Redimensionar();
};

Simu.Diseño.DibujarMatrizLed = function(dibujo, nombre) {
  if (Simu.Diseño.modo == "MODULOS") {
    let claveModulo = `LED_MATRIX_${nombre}`;
    if (claveModulo in Simu.Diseño.componentes && 'imagen' in Simu.Diseño.componentes[claveModulo]) {
      for (let i=0; i<64; i++) {
        if (dibujo.length > i && Simu.Diseño.componentes[claveModulo].imagen.length > i) {
          Simu.Diseño.componentes[claveModulo].imagen[i].CambiarRutaA_(
            Simu.rutaImagen(dibujo[i] == "O" ? "ledMatrizPrendida.svg" : "ledMatrizApagada.svg")
          );
        }
      }
    }
  }
  Mila.Pantalla._Redimensionar();
};

Simu.Diseño.AsignarValorPin = function(pin, valor) {
  if (pin in Simu.Diseño.pinesIO && 'etiqueta' in Simu.Diseño.pinesIO[pin]) {
    Simu.Diseño.pinesIO[pin].valor = valor;
    Simu.Diseño.pinesIO[pin].etiqueta.CambiarTextoA_(valor);
  }
};

Simu.Diseño.ReiniciarValoresPines = function() {
  for (let pin in Simu.Diseño.pinesIO) {
    Simu.Diseño.pinesIO[pin].valor = "-";
    if ('etiqueta' in Simu.Diseño.pinesIO[pin]) {
      Simu.Diseño.pinesIO[pin].etiqueta.CambiarTextoA_("-");
    }
  }
};

Simu.Diseño.ReiniciarValoresMódulos = function() {
  for (let claveModulo in Simu.Diseño.componentes) {
    const modulo = Simu.Diseño.componentes[claveModulo];
    switch (modulo.componente) {
      case "PIN":
        if (modulo.modo[1] == 'OUT') {
          modulo.imagen.CambiarTextoA_('-');
        }
        break;
      case "LED":
        modulo.imagen.CambiarRutaA_(Simu.rutaImagen("ledApagada.svg"));
        break;
      case "BUZZER":
        modulo.imagen.CambiarTextoA_("Imagen de un buzzer apagado");
        break;
      case "LED_MATRIX":
        for (let i of modulo.imagen) {
          i.CambiarRutaA_(Simu.rutaImagen("ledMatrizApagada.svg"));
        }
        break;
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