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

// Bucle infinito que se ejecuta de forma indefinida cada 1000/60 milisegundos
const indefinido = setInterval(() => {
    //Movemos la bola de arriba a abajo
    let bola = partida.bola;
    bola.y = bola.y + 4;
    if (bola.y > 256) {
        bola.y = 0;
    }
    io.sockets.emit('bola', bola);
}, 1000/60);

//Levantamos el servidor
server.listen(app.get('port'), () => console.log(`Escuchando de ${app.get('port')}`));