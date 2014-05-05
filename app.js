var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(1337);

var tenz = function tenzRoute(req, res){
	res.sendfile('./index.html');
};

app.use('/',express.static(__dirname));

app.get('/',tenz);

var map;
var actors;
var freeCells;

io.sockets.on('connection', function (socket) {
	socket.on('updateMap&Actors',function (data){
		map = data.map;
		actors = data.actors;
		freeCells = data.freeCells;
		console.log("Got Map & Actors");
		console.log(actors);
	});
	socket.on('somethingMoved',function (data){
		io.sockets.emit('finishedTurn', data);
	});
	socket.on('player2init',function(){
		console.log("Sending p2 init data");
		socket.emit('initData', {map : map, actors : actors, freeCells: freeCells});
	});
	socket.on('newPlayer',function (data){
		io.sockets.emit('newPlayer', data);
	});
	socket.on('yourTurn',function(){
    
    	io.sockets.emit('yourTurn');
    
	});
});