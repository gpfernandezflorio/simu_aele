Mila.Modulo({
  necesita:["$milascript/base","$milascript/archivo"]
});

Mila.Archivo.AbrirArchivo_YLuego_("src/simu.js", function(resultado) {
  if ('error' in resultado) {
    Mostrar("Error");
    return;
  }
  Mila.Archivo.Escribir_EnElArchivo_(resultado.contenido, "build/index.js");
  Mostrar("cd build");
  Mostrar("mila milascript/scripts/build index");
  Mostrar("* Reemplazar en build/index.html:");
  Mostrar("   - 'index.js' por '../src/simu.js'");
  Mostrar("   - '../src/pequescript' por 'pequescript'");
});