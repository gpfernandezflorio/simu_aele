Mila.Modulo({
  define:"Simu.Diseño",
  necesita:["$milascript/base"],
  usa:["$milascript/pantalla"]
});

Simu.Diseño.inicializar = function() {
  Simu.Diseño.panel = Mila.Pantalla.nuevoPanel();
  return Simu.Diseño.panel;
};

Simu.Diseño.placaActual = {
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
};

Simu.Diseño.setupPlaca = {
  // 8:{modo:"ENTRADA", rango:"BINARIO"},
  // 9:{modo:"SALIDA", rango:"A256"},
  // 10:{modo:"SALIDA", rango:"BINARIO"},
  // 11:{modo:"ENTRADA", rango:"BINARIO"},
  12:{modo:"SALIDA", rango:"BINARIO"} //,
  // A1:{modo:"SALIDA", rango:"BINARIO"},
  // A3:{modo:"ENTRADA", rango:"BINARIO"},
  // A4:{modo:"ENTRADA", rango:"A1024"}
};

Simu.Diseño.DibujarPines = function() {
  
  /*PANEL*/ for (let e of Simu.Diseño.panel._elementos) {e.QuitarDelHtml();}

  
  const pines = [];
  for (let pin in Simu.mostrarPinesDesconectados.marcado()
    ? Simu.Diseño.placaActual.pines
    : Simu.Diseño.setupPlaca
  ) {
    pines.push(Simu.Diseño.panelParaPin_(pin));
  }
  Simu.Diseño.panel.CambiarElementosA_(pines);


  /*PANEL*/
    for (let e of Simu.Diseño.panel._elementos) {e.PlasmarEnHtml(Simu.Diseño.panel._nodoHtml);}
    Mila.Pantalla._Redimensionar();
};

Simu.Diseño.panelParaPin_ = function(pin) {
  const estáConectado = pin in Simu.Diseño.setupPlaca;
  const botonConexion = Mila.Pantalla.nuevoBoton({texto:estáConectado ? "Desconectar" : "Conectar"});
  const panelIzquierdo = Mila.Pantalla.nuevoPanel({alto:"Minimizar",disposicion:"Horizontal"});
  const panelMedio = Mila.Pantalla.nuevoPanel({alto:"Minimizar",disposicion:"Horizontal"});
  const panelDerecho = Mila.Pantalla.nuevoPanel({alto:"Minimizar",disposicion:"Horizontal"});
  panelIzquierdo.AgregarElemento_(Mila.Pantalla.nuevaEtiqueta({texto:pin,ancho:60}));
  if (estáConectado) {
    const esEntrada = Simu.Diseño.setupPlaca[pin].modo == "ENTRADA";
    const esDigital = Simu.Diseño.setupPlaca[pin].rango == "BINARIO";
    panelIzquierdo.AgregarElemento_(Mila.Pantalla.nuevaEtiqueta({texto:"Modo:"}));
    panelIzquierdo.AgregarElemento_(Mila.Pantalla.nuevoBoton({texto:esEntrada ? "Entrada" : "Salida"}));
    panelIzquierdo.AgregarElemento_(Mila.Pantalla.nuevoBoton({texto:esDigital
      ? "Digital"
      : (Simu.Diseño.setupPlaca[pin].rango == "A256" ? "Pwm" : "Analógica")
    }));
    if (esEntrada) {
      if (esDigital) {
        panelMedio.AgregarElemento_(Mila.Pantalla.nuevaCasillaVerificacion({ancho:"Maximizar"}));
      } else {
        panelMedio.AgregarElemento_(Mila.Pantalla.nuevoDeslizador({ancho:"Maximizar"}));
      }
    } else {
      const etiquetaValor = Mila.Pantalla.nuevaEtiqueta({texto:"-",ancho:"Maximizar"});
      Simu.Diseño.setupPlaca[pin].etiqueta = etiquetaValor;
      panelMedio.AgregarElemento_(etiquetaValor);
    }
    panelDerecho.AgregarElemento_(botonConexion);
  } else {
    panelIzquierdo.AgregarElemento_(Mila.Pantalla.nuevaEtiqueta({texto:"(desconectado)"}));
    panelMedio.AgregarElemento_(botonConexion);
  }
  return Mila.Pantalla.nuevoPanel({elementos:[panelIzquierdo,panelMedio,panelDerecho],alto:"Minimizar",disposicion:"Horizontal"});
};

Simu.Diseño.AsignarValorPin = function(pin, valor) {
  if (pin in Simu.Diseño.setupPlaca && 'etiqueta' in Simu.Diseño.setupPlaca[pin]) {
    Simu.Diseño.setupPlaca[pin].etiqueta.CambiarTextoA_(valor);
  }
};

Simu.Diseño.ReiniciarValoresPines = function() {
  for (let pin in Simu.Diseño.setupPlaca) {
    if ('etiqueta' in Simu.Diseño.setupPlaca[pin]) {
      Simu.Diseño.setupPlaca[pin].etiqueta.CambiarTextoA_("-");
    }
  }
};