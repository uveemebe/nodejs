// Módulos de nodejs
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

// Inicializamos los módulos
app.set('port', process.env.PORT || 5000);
app.use(express.static('public'));

let sesiones = [];
let puntos = [];
let bola = {left: 128, top: 0};

io.on('connection', function(socket) {
    // Nos guardamos la sesión poniéndole un Id en función de la fecha y su response
    const sesion = {id: Date.now(), socket: socket};
    sesiones.push(sesion);

    socket.emit('puntos', puntos);
    socket.on('punto', function(punto) {
        console.log(`Punto: ${punto}`);
        puntos = puntos.filter(p => (p.jugador !== punto.jugador || p.partida !== punto.partida));
        puntos.push(punto);
        socket.broadcast.emit('puntos', [punto]);
    });
    socket.on('disconnect', function(data) {
        console.log(`${sesion.id} Connection closed`);
        sesiones = sesiones.filter(s => s.id !== sesion.id);
    });
  });

// Función que se ejecuta de forma indefinida cada 1000/60 milisegundos
const indefinido = setInterval(() => {
    bola.top = bola.top + 4;
    if (bola.top > 256) {
        bola.top = 0;
        let punto = {jugador: "white", partida: "1", x: bola.left, y: bola.top};
        io.sockets.emit('puntos', [punto]);
    }
    }, 1000/60);


server.listen(app.get('port'), () => console.log(`Escuchando de ${app.get('port')}`));