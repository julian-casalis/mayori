let carrito = [];

const botones = document.querySelectorAll(".agregar");

const contenedor = document.getElementById("cart-items");

const total = document.getElementById("total");

botones.forEach(boton => {

    boton.addEventListener("click", () => {

        const producto = {

            id: boton.dataset.id,

            nombre: boton.dataset.nombre,

            precio: Number(boton.dataset.precio)

        };

        carrito.push(producto);

        actualizarCarrito();

    });

});

function actualizarCarrito(){

    contenedor.innerHTML = "";

    let suma = 0;

    carrito.forEach(producto=>{

        suma += producto.precio;

        contenedor.innerHTML += `

            <p>

            ${producto.nombre}

            - $

            ${producto.precio}

            </p>

        `;

    });

    total.innerText = "Total: $" + suma;

}