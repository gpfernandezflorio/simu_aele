Mila.Modulo({
  define:"Simu.Interprete",
  necesita:["$milascript/base"],
  usaJs:["acorn_interpreter"]
});

Simu.Interprete.Estado = Mila.Tipo.Variante("Estado",
  ["Vacio","Listo","Ejecutando","Pausado","Detenido","Finalizado"]
);

Simu.Interprete._Interprete = function Interprete(api={}) {
  this.estado = Simu.Interprete.Estado.Vacio;
  this.CargarAPI(api);
};

Mila.Tipo.Registrar({
  nombre:"Interprete",
  prototipo:Simu.Interprete._Interprete
});

Simu.Interprete.nuevo = function(api={}) {
  return new Simu.Interprete._Interprete(api);
};

Simu.Interprete._Interprete.prototype.CargarAPI = function(api) {
  this.api = function(interprete, entorno) {
    for (let k in api) {
      interprete.setProperty(entorno, k, interprete.createNativeFunction(api[k]));
    }
  };
};

Simu.Interprete._Interprete.prototype.CargarCodigo = function(codigo) {
  this.codigo = codigo;
  this.interprete = new Interpreter(codigo, this.api);
  this.estado = Simu.Interprete.Estado.Listo;
};

Simu.Interprete._Interprete.prototype.Ejecutar = function() {
  this.estado = Simu.Interprete.Estado.Ejecutando;
  setTimeout(this.DarPaso.bind(this), 1);
};

Simu.Interprete._Interprete.prototype.DarPaso = function() {
  if (this.estado.esIgualA_(Simu.Interprete.Estado.Ejecutando)) {
    this.interprete.step();
    setTimeout(this.DarPaso.bind(this), 1);
  }
};

Simu.Interprete._Interprete.prototype.Detener = function() {
  this.estado = Simu.Interprete.Estado.Detenido;
};

Simu.Interprete._Interprete.prototype.Pausar = function() {
  this.estado = Simu.Interprete.Estado.Pausado;
};

Simu.Interprete._Interprete.prototype.Continuar = function() {
  if (this.estado.esIgualA_(Simu.Interprete.Estado.Pausado)) {
    this.Ejecutar();
  }
};

Simu.Interprete._Interprete.prototype.enEjecución = function() {
  return this.estado.esIgualA_(Simu.Interprete.Estado.Ejecutando) ||
    this.estado.esIgualA_(Simu.Interprete.Estado.Pausado);
};