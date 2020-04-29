// Módulos de nodejs
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

// Inicializamos los módulos
app.set('port', process.env.PORT || 5000);
app.use(express.static('public'));

let puntos = [];
let bola = {jugador: "white", x: 128, y: 0};

io.on('connection', function(socket) {
    //Cuando alguien se conecta, le enviamos la situación de todos los puntos
    socket.emit('puntos', puntos);
    //Cuando alguien se mueve, se lo enviamos a todos los demás
    socket.on('punto', function(punto) {
        puntos = puntos.filter(p => (p.jugador !== punto.jugador));
        puntos.push(punto);
        socket.broadcast.emit('puntos', [punto]);
    });
});

// Bucle infinito que se ejecuta de forma indefinida cada 1000/60 milisegundos
const indefinido = setInterval(() => {
    bola.y = bola.y + 4;
    if (bola.y > 256) {
        bola.y = 0;
    }
    io.sockets.emit('puntos', [bola]);
}, 1000/60);

server.listen(app.get('port'), () => console.log(`Escuchando de ${app.get('port')}`));