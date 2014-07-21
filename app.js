var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
var bodyParser = require('body-parser');

app.use(bodyParser.json());

server.listen(1337);

var tenz = function tenzRoute(req, res){
	res.sendfile('./index.html');
};
var saveMap = function saveMapRoute(req,res){
	//Recieve JSON data, sanatize it, and save it as a .json file.
	console.log("Recieved data:");
	console.log(req.body);
	if(!verifyMap(req.body.map)) {
		console.log("Something suspicious just occured in map.");
		res.send(403);
	}else if(!verifyGameObjects(req.body.gameObj)){
		console.log("Something suspicious just occured in objs.");
		res.send(403);
	}else {
		//ToDo:Save the map
		res.send(200);
	};

	function verifyMap(potentialMap){
		var cunningFilter = /^[\.#P]$/;
		var tile;

		for (tile in potentialMap){
			if(!cunningFilter.test(potentialMap[tile])) return false;
		}
		return true;
	};

	function verifyGameObjects(potentialObjects){
		//ToDo:Look for suspicious game objects and return false if found
		var gameObjName;
		for (gameObjName in potentialObjects){
			if(!/^[ \w']+$/.test(gameObjName)) return false; //this filter probably needs to be checked out out more thoroughly
			if(!/^[a-zA-Z]+$/.test(potentialObjects[gameObjName].color)) return false;
			if(!/^\.{1}$/.test(potentialObjects[gameObjName].rune)) return false;  //this filter probably needs to be checked out out more thoroughly
			if(!/^\d+$/.test(potentialObjects[gameObjName].x)) return false;
			if(!/^\d+$/.test(potentialObjects[gameObjName].y)) return false;
		}
		return true;
	};
};

app.use('/',express.static(__dirname));

app.get('/',tenz);
app.post('/saveMap',saveMap);

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
