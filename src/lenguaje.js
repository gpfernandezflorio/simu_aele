Mila.Modulo({
  define:"Simu.Lenguaje",
  necesita:["$milascript/base"],
  usa:["disenio"]
});

Simu.Lenguaje.comandosPrimitivos = {
  "Encender led":{
    idJs:"EncenderLed",
    exec:function(pin) {
      Simu.Diseño.AsignarValorPin(pin, "HIGH");
    }
  },
  "Apagar led":{
    idJs:"ApagarLed",
    exec:function(pin) {
      Simu.Diseño.AsignarValorPin(pin, "LOW");
    }
  },
  "Esperar":{
    idJs:"Esperar",
    exec:function(cantidadMilisegundos) {
      Simu.DetenerInterpretePor_Milisegundos(cantidadMilisegundos);
    }
  }
};

Simu.Lenguaje.mapaPrimitivas = {};
for (let k in Simu.Lenguaje.comandosPrimitivos) {
  Simu.Lenguaje.mapaPrimitivas[Simu.Lenguaje.comandosPrimitivos[k].idJs] =
    Simu.Lenguaje.comandosPrimitivos[k].exec;
};