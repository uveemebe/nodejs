/* Desde la terminal de Visual Studio Code:
Para instalar los módulos (una vez por proyecto):
    npm install express
    npm install http
    npm install socket.io
Para desplegar en local (http://localhost:5000/):
    node server.js
Para añadir nuevos ficheros:
    git add .
Para confirmar los cambios que has hecho:
    git commit -am "mis cambios"
Para subir al servidor remoto:
    git push heroku master
*/

// Cargamos los módulos de nodejs
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
// Y los inicializamos
app.set('port', process.env.PORT || 5000);
app.use(express.static('public'));

//Variable donde vamos a almacenar los datos de la partida en cada momento
let partida = {
    jugador: {
        red: {color: "red", x: 0, y: 0}, 
        blue: {color: "blue", x: 0, y: 248}, 
        green: {color: "green", x: 248, y: 0}, 
        yellow: {color: "yellow", x: 248, y: 248}, 
    },
    bola: {color: "white", x: 128, y: 0}
};

//Función a la que se llama cada vez que un usuario se conecta a los sockets
io.on('connection', function(socket) {
    //Enviamos la situación de los puntos y de la bola
    socket.emit('puntos', [ partida.jugador["red"], partida.jugador["blue"], partida.jugador["green"], partida.jugador["yellow"] ]);
    socket.emit('bola', [ partida.bola ]);
    //Cuando alguien mueve su punto, se lo enviamos a todos los demás
    socket.on('punto', function(punto) {
        partida[punto.jugador] = punto;
        socket.broadcast.emit('puntos', [ punto ]); //cuando pasas una variable entre [] es lo mismo que pasar un array con ese elemento
    });
});

// Variable en la que nos guardaremos el comportamiento de la bola, por defecto, ninguno
let bola = {
    activa: false, 
    velocidad: 4, 
    mover: () => { // Función que mueve la bola en función de su velocidad
        partida.bola.y = partida.bola.y + bola.velocidad;
        if (partida.bola.y > 256) {
            partida.bola.y = 0;
        }
        // Emitimos la nueva posición de la bola a todos los jugadores
        io.sockets.emit('bola', partida.bola);
    },
    interval: null
};

// Interceptamos cualquier llamada a la ruta relativa /bola/datos para obtener los datos actuales de la bola
app.get('/bola/datos', function(request, response) {
    // Devolvemos un json con los datos actuales de la bola
    response.json({activa: bola.activa, velocidad: bola.velocidad});
});

// Interceptamos cualquier llamada a la ruta relativa /bola/activa/:activa para activar o desactivar la bola
//  donde :activa puede ser true o false
app.get('/bola/activa/:activa', function(request, response) {
    /* Los parámetros que hemos puesto con ":" nos llegan en request.params */
    bola.activa = request.params.activa === "true"; /* Se recive un string en vez de un boolean, por lo que hay que convertirlo antes de nada */
    if (bola.activa && !bola.interval) { /* */
        // Iniciamos un bucle infinito que se ejecuta 60 veces por segundo y nos lo guardamos para cuando haya que detenerlo
        bola.interval = setInterval(bola.mover, 1000/60);
    }
    else if (bola.interval) {
        // Cuando desactivamos la bola, detenemos el bucle infinito
        clearInterval(bola.interval);
        bola.interval = null;
    }
    response.send(bola.activa);
});

// Interceptamos cualquier llamada a la ruta relativa /bola/velocidad/:velocidad para cambiar la velocidad
//  donde :velocidad es un número
app.get('/bola/velocidad/:velocidad', function(request, response) {
    bola.velocidad = parseInt(request.params.velocidad); /* Se recive un string en vez de un integer */
    response.send(request.params.velocidad);
});

//Levantamos el servidor
server.listen(app.get('port'), () => {
    console.log(`Escuchando de ${app.get('port')}`);
});