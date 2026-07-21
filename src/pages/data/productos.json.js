/*
  src/pages/data/productos.json.js
  --------------------------------------------------
  Esto es un "endpoint" de Astro: en vez de una página HTML,
  genera un archivo estático /data/productos.json en el build,
  con el mismo contenido que src/data/productos.json.

  ¿Por qué existe esto si ya tenemos src/data/productos.json?
  Porque los archivos en src/ solo están disponibles durante el
  BUILD (cuando Astro arma las páginas .astro). El carrito, en
  cambio, corre en el NAVEGADOR del cliente y necesita poder
  pedir los datos de los productos con fetch() en tiempo real
  (por ejemplo, para saber el precio actualizado de un item
  guardado en el carrito). Este endpoint resuelve eso sin
  duplicar el archivo a mano: siempre se genera a partir de
  la MISMA fuente de datos (src/data/productos.json).

  Si en el futuro se conecta una base de datos o API real,
  este archivo es el lugar natural para reemplazar por una
  consulta dinámica (cambiando output de la página a 'server'
  y devolviendo los datos desde la base de datos).
--------------------------------------------------
*/
import productos from '../../data/productos.json';

export async function GET() {
  return new Response(JSON.stringify(productos), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
