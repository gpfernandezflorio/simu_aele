Mila.Modulo({
  necesita:["$milascript/base","$milascript/archivo","$milascript/error","$milascript/sistema"]
});

Mila.Archivo.AbrirArchivo_YLuego_("src/simu.js", function(resultado) {
  if (resultado.falló()) {
    Mostrar("Error");
    Mila.MostrarError(resultado.error);
    return;
  }
  Mila.Archivo.Escribir_EnElArchivo_YLuego_(resultado.contenido, "build/index.js", (resultado) => {
    if (resultado.falló()) {
      Mostrar("Error");
      Mila.MostrarError(resultado.error);
      return;
    }
    Mila.Archivo.NavegarA_("build");
    Mila.Sistema.EjecutarMila_ConArgumentos_YLuego_("build", "index", (resultado) => {
      if (resultado.falló()) {
        Mostrar("Error");
        Mila.MostrarError(resultado.error);
        return;
      }
      Mostrar(resultado.contenido.stdout);
      Mila.Archivo.AbrirArchivo_YLuego_("index.html", (resultado) => {
        if (resultado.falló()) {
          Mostrar("Error");
          Mila.MostrarError(resultado.error);
          return;
        }
        let nuevoContenido = resultado.contenido;
        nuevoContenido = nuevoContenido.replace('index.js', '../src/simu.js');
        nuevoContenido = nuevoContenido.replaceAll('../src/pequescript', 'pequescript');
        Mila.Archivo.Escribir_EnElArchivo_YLuego_(nuevoContenido, "index.html", (resultado) => {
          if (resultado.falló()) {
            Mostrar("Error");
            Mila.MostrarError(resultado.error);
            return;
          }
          Mostrar("OK");
        });
      });
    });
  });
});