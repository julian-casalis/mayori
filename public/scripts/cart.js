/*
  cart.js
  --------------------------------------------------
  Este archivo es el "cerebro" del carrito de compras.
  Se carga en TODAS las páginas (ver Layout.astro) y
  expone un objeto global `window.Carrito` con toda la
  lógica necesaria para que cualquier componente pueda:

    Carrito.obtener()              -> array de items del carrito
    Carrito.agregar(id, cantidad)  -> agrega un producto
    Carrito.actualizarCantidad()   -> cambia la cantidad de un item
    Carrito.eliminar(id)           -> saca un producto del carrito
    Carrito.vaciar()               -> vacía todo el carrito
    Carrito.obtenerTotal()         -> total en pesos
    Carrito.obtenerCantidadTotal() -> cantidad de unidades total
    Carrito.obtenerProductos()     -> catálogo completo (cacheado)

  El carrito se guarda en localStorage bajo la clave
  "carrito-distribuidora" para que persista aunque el
  usuario cierre la pestaña o recargue la página.

  Cada vez que el carrito cambia, se dispara un evento
  personalizado "carrito:actualizado" sobre `window`.
  Cualquier componente (Navbar, CartSidebar, carrito.astro)
  puede escuchar ese evento para re-renderizarse.
  --------------------------------------------------
*/

const CLAVE_STORAGE = 'carrito-distribuidora';
const EVENTO_ACTUALIZADO = 'carrito:actualizado';
const RUTA_PRODUCTOS = '/data/productos.json';

let cacheProductos = null;

/** Lee el carrito guardado en localStorage. Devuelve [] si no hay nada. */
function leerStorage() {
  try {
    const crudo = localStorage.getItem(CLAVE_STORAGE);
    return crudo ? JSON.parse(crudo) : [];
  } catch (error) {
    console.error('No se pudo leer el carrito guardado:', error);
    return [];
  }
}

/** Guarda el carrito en localStorage y avisa a toda la app que cambió. */
function guardarStorage(items) {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENTO_ACTUALIZADO, { detail: { items } }));
}

/** Trae el catálogo completo de productos (con caché en memoria). */
async function obtenerProductos() {
  if (cacheProductos) return cacheProductos;
  const respuesta = await fetch(RUTA_PRODUCTOS);
  cacheProductos = await respuesta.json();
  return cacheProductos;
}

/** Devuelve los items del carrito tal cual están guardados: [{id, cantidad}] */
function obtener() {
  return leerStorage();
}

/** Agrega `cantidad` unidades de un producto. Si ya existe, suma la cantidad. */
function agregar(idProducto, cantidad = 1) {
  const items = leerStorage();
  const existente = items.find((item) => item.id === idProducto);

  if (existente) {
    existente.cantidad += cantidad;
  } else {
    items.push({ id: idProducto, cantidad });
  }

  guardarStorage(items);
}

/** Establece una cantidad exacta para un producto (mínimo 1). */
function actualizarCantidad(idProducto, nuevaCantidad) {
  const items = leerStorage();
  const item = items.find((i) => i.id === idProducto);
  if (!item) return;

  if (nuevaCantidad <= 0) {
    eliminar(idProducto);
    return;
  }

  item.cantidad = nuevaCantidad;
  guardarStorage(items);
}

/** Elimina un producto del carrito por completo. */
function eliminar(idProducto) {
  const items = leerStorage().filter((item) => item.id !== idProducto);
  guardarStorage(items);
}

/** Vacía todo el carrito. */
function vaciar() {
  guardarStorage([]);
}

/** Cruza los items del carrito con el catálogo para tener nombre/precio/imagen. */
async function obtenerItemsDetallados() {
  const [items, productos] = await Promise.all([Promise.resolve(leerStorage()), obtenerProductos()]);

  return items
    .map((item) => {
      const producto = productos.find((p) => p.id === item.id);
      if (!producto) return null; // producto eliminado del catálogo
      return { ...producto, cantidad: item.cantidad };
    })
    .filter(Boolean);
}

/** Calcula el total en pesos de todo el carrito. */
async function obtenerTotal() {
  const detallados = await obtenerItemsDetallados();
  return detallados.reduce((acum, item) => acum + item.precio * item.cantidad, 0);
}

/** Calcula cuántas unidades hay en total (para el contador del navbar). */
function obtenerCantidadTotal() {
  return leerStorage().reduce((acum, item) => acum + item.cantidad, 0);
}

/** Formatea un número como pesos argentinos: $18.500 */
function formatearPrecio(numero) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numero);
}

/*
  Construye el mensaje de WhatsApp con el detalle del pedido
  y abre una nueva pestaña hacia wa.me con el mensaje precargado.

  👉 Para cambiar el número de WhatsApp de la distribuidora,
     modificá la constante NUMERO_WHATSAPP más abajo (formato
     internacional sin "+" ni espacios, ej: 5493400123456).
*/
const NUMERO_WHATSAPP = '5493400000000';

async function enviarPedidoPorWhatsapp() {
  const items = await obtenerItemsDetallados();
  if (items.length === 0) return false;

  const lineas = items.map(
    (item) => `${item.cantidad} x ${item.nombre} — ${formatearPrecio(item.precio * item.cantidad)}`
  );

  const total = items.reduce((acum, item) => acum + item.precio * item.cantidad, 0);

  const mensaje = [
    'Hola! 👋 Quiero realizar el siguiente pedido:',
    '',
    '----------------------------',
    ...lineas,
    '----------------------------',
    '',
    `Total: ${formatearPrecio(total)}`,
    '',
    'Muchas gracias.',
  ].join('\n');

  const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank', 'noopener');

  return true;
}

window.Carrito = {
  obtener,
  agregar,
  actualizarCantidad,
  eliminar,
  vaciar,
  obtenerTotal,
  obtenerCantidadTotal,
  obtenerItemsDetallados,
  obtenerProductos,
  formatearPrecio,
  enviarPedidoPorWhatsapp,
  EVENTO_ACTUALIZADO,
};
