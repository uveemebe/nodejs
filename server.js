// Módulos de nodejs
const express = require('express');
const url = require('url');
const bodyParser = require('body-parser');
const cors = require('cors');

// Inicializamos los módulos
const app = express();
app.set('port', process.env.PORT || 5000);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));

let sesiones = [];
let puntos = [];
let bola = {left: 128, top: 0};

// Definimos las URL relativas que atiende nuestra aplicación y la función que procesa cada petición
app.get('/eventos', eventos);
app.post('/mover', mover);

// Función a la que se llama cuando nos suscribimos a los eventos (por aquí se pasa una vez por sesión)
function eventos(request, response, next) {
    const headers = {'Content-Type': 'text/event-stream', 'Connection': 'keep-alive', 'Cache-Control': 'no-cache'};
    response.writeHead(200, headers);

    // Nos guardamos la sesión poniéndole un Id en función de la fecha y su response
    const sesion = {id: Date.now(), response: response};
    sesiones.push(sesion);

    response.write(`data: ${JSON.stringify(puntos)}\n\n`)

    // Eliminamos la sesión cuando el cliente se desconecta (cierra el navegador por ejemplo)
    request.on('close', () => {
        console.log(`${sesion.id} Connection closed`);
        sesiones = sesiones.filter(s => s.id !== sesion.id);
    });
}

// Función a la que se llama cada vez que movemos nuestro punto
async function mover(request, response, next) {
    // Obtenemos los parámetros que se han pasado así "?jugador=red&partida=1&x=15&y=10" por ejemplo
    let punto = {jugador: request.body.jugador, partida: request.body.partida, x: request.body.x, y: request.body.y};
    response.json(punto);
//    puntos = puntos.filter(p => (p.jugador !== punto.jugador || p.partida !== punto.partida));
//    puntos.push(punto);
    console.log(puntos);
    return notificar(punto);
}

// Función a la que llamamos cada vez que queremos notificar algo a cada sesión
function notificar(punto) {
    sesiones.forEach(s => {
        s.response.write(`data: ${JSON.stringify([punto])}\n\n`)
    });
}

// Función que se ejecuta de forma indefinida cada 1000/60 milisegundos
const indefinido = setInterval(() => {
    bola.top = bola.top + 4;
    if (bola.top > 256) {
        bola.top = 0;
        let punto = {jugador: "white", partida: "1", x: bola.left, y: bola.top};
        notificar(punto);
    }
    }, 1000/60);


app.listen(app.get('port'), () => console.log(`Swamp Events service listening on port 3000`));