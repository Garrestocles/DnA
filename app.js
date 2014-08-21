var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
//var bodyParser = require('body-parser');

//app.use(bodyParser.json());

server.listen(1337);

var tenz = function tenzRoute(req, res){
	res.sendfile('./index.html');
};
/*
//A bunch of stuff I used when I was uploading files to the server.
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
	}else if(verifyFileName(req.body.filename)){
		console.log("Something suspicious just occured in Filename.");
		res.send(403);
	} else{
		fs.writeFile("./maps/"+req.body.filename+".json",JSON.stringify(req.body),function(err){
			if(err){
				res.send(500);
				throw err;
			}
		});
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
			if(!/^[ \w'\d]+$/.test(gameObjName)) {console.log('a');return false}; //this filter probably needs to be more robustly tested
			if(!/^[a-zA-Z]+$/.test(potentialObjects[gameObjName].color)) {console.log('b');return false};
			if(!/^\S{1}$/.test(potentialObjects[gameObjName].rune)) {console.log('c');return false};  //this filter probably needs to be more robustly tested
			if(!/^\d+$/.test(potentialObjects[gameObjName].x)) {console.log('d');return false};
			if(!/^\d+$/.test(potentialObjects[gameObjName].y)) {console.log('e');return false};
		}
		return true;
	};
	function verifyFileName(potentialName){
		return !/^[\w\d]+$/.test(potentialName) ? true : false;
	};
};
*/
app.use('/',express.static(__dirname));

app.get('/',tenz);
app.get('/mapMaker',function(req,res){
	res.sendfile('./mapMaker.html');
});
//app.post('/saveMap',saveMap);

var map;
var actors;
var freeCells;

var hasASCIIMaster = false;

io.sockets.on('connection', function (socket) {

	var thisPlayer;
	var bad = false;

	socket.on('updateMap&Actors',function (data){
		if(true){//Fix this later so other people can't hijack games
			map = data.map;
			actors = data.actors;
			freeCells = data.freeCells;
			console.log("Got Map & Actors");
			console.log(actors);
			thisPlayer = "ASCIIMaster";
			hasASCIIMaster = true;
			io.sockets.emit('initData', {map : map, actors : actors, freeCells: freeCells});
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
