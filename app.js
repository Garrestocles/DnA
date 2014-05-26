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

var hasASCIIMaster = false;

io.sockets.on('connection', function (socket) {

	var thisPlayer;
	var bad = false;

	socket.on('updateMap&Actors',function (data){
		if(!hasASCIIMaster){
			map = data.map;
			actors = data.actors;
			freeCells = data.freeCells;
			console.log("Got Map & Actors");
			console.log(actors);
			thisPlayer = "ASCIIMaster";
			hasASCIIMaster = true;
		}else{
			socket.emit('monotheism',"nope");
			bad = true;
			socket.disconnect();
		}
		
	});
	socket.on('somethingMoved',function (data){
		io.sockets.emit('finishedTurn', data);
	});
	socket.on('player2init',function(){
		//console.log("Sending p2 init data");
		socket.emit('initData', {map : map, actors : actors, freeCells: freeCells});
	});
	socket.on('newPlayer',function (data){
		io.sockets.emit('newPlayer', data);
		console.log("Got new player");
		
		actors[data.name] = data;
		thisPlayer = data.name;
	});
	socket.on('newActor',function (data){
		io.sockets.emit('newPlayer', data);
		console.log("Got new player");
		
		actors[data.name] = data;
		//thisPlayer = data.name;
	});
	socket.on('yourTurn',function (data){
			console.log("Your turn data:" + data);
    		io.sockets.emit('yourTurn',data);
    
	});
	socket.on('disconnect',function(data){
		if(thisPlayer === "ASCIIMaster"){
			io.sockets.emit('AMLeft',"Game Over man...");
			hasASCIIMaster = false;
		}else{
			delete actors[thisPlayer];
			io.sockets.emit('playerLeft',thisPlayer);
			console.log(thisPlayer + " disconnected.");
		}
	});
});