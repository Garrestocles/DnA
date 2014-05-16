//Global vars for Everyone
//Init Display
var display = new ROT.Display({spacing:1.4});
var map = {};

var socket = io.connect(window.location.origin);

var actors = {};
var freeCells;
var master;

var name;
var color;
//Things only used by Session 0
var scheduler;
var engine;

var currentTurn;

var init = function (){
	name = document.forms[0].name.value;
	color = document.forms[0].color.value;
	master = (document.forms[0].master.value == "yes")? true : false;

	document.forms[0].style.display = "none";
	document.body.appendChild(display.getContainer());
	
	if(master){
		masterSockets();
		createMap();

	    scheduler = new ROT.Scheduler.Simple();
	    scheduler.add(actors["player"],true);
	    scheduler.add(actors["cat"],true);
	    engine = new ROT.Engine(scheduler);
	    engine.start();

	    socket.emit('updateMap&Actors',{map : map, actors : actors, freeCells: freeCells});
	}else{
		clientSockets();
		socket.emit('player2init',"hi");
	}
	socket.emit('yourTurn',"it worked");
};

var drawMap = function(){
	for (var key in this.map) {
        var parts = key.split(",");
        var x = parseInt(parts[0]);
        var y = parseInt(parts[1]);
        this.display.draw(x, y, this.map[key]);
    }
};
socket.on('finishedTurn',function(data){
    var x = actors[data.what].x;
    var y = actors[data.what].y;

    display.draw(x, y, map[x+","+y]);
    actors[data.what].update(data.newX, data.newY);
    
});
socket.on('playerLeft',function (data){
	actors[data].removeMe();
});
socket.on('AMLeft',function (data){
    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    };
    confirm("Rocks fall, everyone dies.");
});
var masterSockets = function (){
	socket.on('newPlayer',function (data){
	    
	    actors[data.name] = new RemoteActor(data.x,data.y,data.rune,data.color,data.name);
	    scheduler.add(actors[data.name],true);
	});
	socket.on('yourTurn',function(data){
	    document.getElementById("WhoseTurn").innerHTML = data.whoseTurn + "'s Turn";
	    currentTurn = data.whoseTurn;
	});
};
var clientSockets = function (){
	socket.on('newPlayer',function (data){
	    
	    if(data.name !== name)
	        actors[data.name] = new Actor(data.x,data.y,data.rune,data.color,data.name);
	});
	socket.on('yourTurn',function(data){
	    document.getElementById("WhoseTurn").innerHTML = data.whoseTurn + "'s Turn";
	    currentTurn = data.whoseTurn;
	    if(data.whoseTurn === name)
	        actors[name].act();
	    
	});
	socket.on('initData',function (data){
		map = data.map;
		actors = data.actors;
		freeCells = data.freeCells;

		document.body.appendChild(display.getContainer());
		drawMap();

		
		for (actor in data.actors){
			actors[actor] = new Actor(data.actors[actor].x,data.actors[actor].y,data.actors[actor].rune,data.actors[actor].color,data.actors[actor].name);
		};

		var index = Math.floor(ROT.RNG.getUniform() * freeCells.length); 
	    var key = freeCells.splice(index, 1)[0];
	    var parts = key.split(",");
	    var x = parseInt(parts[0]);
	    var y = parseInt(parts[1]);
		actors[name] = new Player2(x,y,color,name);
		socket.emit('newPlayer',actors[name]);
		
	});
};
var createMap = function(){
	var mapLayout = new ROT.Map.Digger();
	freeCells = [];

	mapLayout.create(function(x,y,what){

		if (what === 1) { 
            display.draw(x,y,null,null,"#777");
            
            var key = x+","+y;
            //map[key] = "#";
            return;
        };
        var key = x+","+y;
        map[key] = ".";
        freeCells.push(key);
	}.bind(this));
	drawMap();
	actors["player"] = createCreature(Player, freeCells, name, color);
    actors["cat"] = createCreature(Cat, freeCells, "Sam", "tan");
};
var createCreature = function(what, freeCells, thisName, thisColor){
	var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
    var key = freeCells.splice(index, 1)[0];
    var parts = key.split(",");
    var x = parseInt(parts[0]);
    var y = parseInt(parts[1]);
    return new what(x, y, thisName, thisColor);
};
var Cat = function(xCoord,yCoord, thisName, thisColor){
    this.x = xCoord;
    this.y = yCoord;
    this.rune = "f";
    this.color = thisColor;
    this.name = thisName;
    

    this.draw = function(){
        display.draw(this.x,this.y,this.rune,this.color);
    };
    this.draw();
    this.act = function(){
        var ownerX = actors["player"].x;
        var ownerY = actors["player"].y;
        var newX;
        var newY;

        var passableCallback = function(x,y){
            return(x+","+y in map);
        };
        var aStar = new ROT.Path.AStar(ownerX,ownerY,passableCallback,{topology:8});

        var path = [];
        var pathCallback = function(x,y){
            path.push([x,y]);
        }
        aStar.compute(this.x,this.y,pathCallback);
        if(path.length <= 5){
            var randomDir = Math.floor(Math.random()*16);
            if(randomDir > 7) {return;}
            var diff = ROT.DIRS[8][randomDir];
            newX = this.x + diff[0];
            newY = this.y + diff[1];
            var newKey = newX + "," + newY;
            if (!(newKey in map)) { return; } // cannot move in this direction
            if(map[newKey] == "#"){ return; }    //Cannot move through walls (#s)
            if(newX === ownerX && newY === ownerY){return;};
            
        }else{
            path.shift();
            newX = path[0][0];
            newY = path[0][1];
        }
        socket.emit('somethingMoved',{what: "cat", newX : newX, newY : newY});
    };
    this.update = function(newX,newY){
        this.x = newX;
        this.y = newY;
        this.draw();
    };
};
var Player = function(xCoord, yCoord, thisName, thisColor) {
    this.x = xCoord;
    this.y = yCoord;
    this.rune = "@";
    this.color = thisColor;
    this.name = thisName;

    this.act = function(){
        
        engine.lock();

        socket.emit('yourTurn',{whoseTurn : this.name});
        window.addEventListener("keydown", this);
        
    };
    this.draw = function(){
        display.draw(this.x,this.y,this.rune,this.color);
    };
    this.draw();
    this.handleEvent = function(e){
        var keyMap = {};
        keyMap[38] = 0;
        keyMap[33] = 1;
        keyMap[39] = 2;
        keyMap[34] = 3;
        keyMap[40] = 4;
        keyMap[35] = 5;
        keyMap[37] = 6;
        keyMap[36] = 7;
     
        var code = e.keyCode;
        if(code === 12){
            engine.unlock();
            socket.emit('somethingMoved',{what: "player", newX : this.x, newY : this.y});
            return;
        }
        if (!(code in keyMap)) { return; }
     
        var diff = ROT.DIRS[8][keyMap[code]];
        var newX = this.x + diff[0];
        var newY = this.y + diff[1];
     
        var newKey = newX + "," + newY;
        if (!(newKey in map)) { return; } // cannot move in this direction
            else if(map[newKey] == "#"){return;}    //Cannot move through walls (#s)

        socket.emit('somethingMoved',{what: "player", newX : newX, newY : newY});
        
        window.removeEventListener("keydown", this);
/*
        var lightPasses = function(x,y){
            var key = x+","+y;
            if (key in map) {
                if(map[key] !== "#"){
                    return true; 
                }
                return false;
            }
            return false;
        };
        var fov = new ROT.FOV.RecursiveShadowcasting(lightPasses);
       
        display.clear();
        fov.compute180(x, y, 10, keyMap[code], function(x, y, r, visibility) {
            var ch = (r ? map[x+","+y] : "@");
            var color = (map[x+","+y] ? "#aa0": "#660");
            display.draw(x, y, ch);
        });
*/
        
    };
    this.update = function(newX,newY){
        this.x = newX;
        this.y = newY;
        this.draw();
        if(master){
            engine.unlock();
        };
        
    };
};
var RemoteActor = function(xCoord,yCoord,rune,color,name){
    this.x = xCoord;
    this.y = yCoord;
    this.rune = rune;
    this.color = color;
    this.name = name;

    this.draw = function(){
        display.draw(this.x,this.y,this.rune,this.color);
    };
    this.draw();
    this.act = function(){

        engine.lock();
        socket.emit('yourTurn',{whoseTurn : this.name});
    };
    this.update = function(newX,newY){
        this.x = newX;
        this.y = newY;
        this.draw();
        engine.unlock();
    };
    this.removeMe = function (){
    	display.draw(this.x, this.y, map[this.x+","+this.y]);
    	console.log("Curr Turn: "+currentTurn+" & this.name: "+this.name);
    	if(currentTurn == this.name)
    		engine.unlock();
    	

    	scheduler.remove(actors[this.name]);
    	delete actors[this.name];
    };
};
var Actor = function(xCoord,yCoord,rune,color,name){
    this.x = xCoord;
    this.y = yCoord;
    this.rune = rune;
    this.color = color;
    this.name = name;

    this.draw = function(){
        display.draw(this.x,this.y,this.rune,this.color);
    };
    this.draw();
    this.act = function(){};
    this.update = function(newX,newY){
        this.x = newX;
        this.y = newY;
        this.draw();
    };
    this.removeMe = function (){
    	display.draw(this.x, this.y, map[this.x+","+this.y]);
    	delete actors[this.name];
    };
};
var Player2 = function(xCoord, yCoord, color, name) {
    this.x = xCoord;
    this.y = yCoord;
    this.rune = "@";
    this.color = color;
    this.name = name;

    this.act = function(){
        //engine.lock();
        window.addEventListener("keydown", this);
        
    };
    this.draw = function(){
        display.draw(this.x,this.y,this.rune,this.color);
    };
    this.draw();
    this.handleEvent = function(e){
        var keyMap = {};
        keyMap[38] = 0;
        keyMap[33] = 1;
        keyMap[39] = 2;
        keyMap[34] = 3;
        keyMap[40] = 4;
        keyMap[35] = 5;
        keyMap[37] = 6;
        keyMap[36] = 7;
     
        var code = e.keyCode;
        if(code === 12){
            socket.emit('somethingMoved',{what: name, newX : this.x, newY : this.y});
            window.removeEventListener("keydown", this);
            return;
        }
        if (!(code in keyMap)) { return; }
     
        var diff = ROT.DIRS[8][keyMap[code]];
        var newX = this.x + diff[0];
        var newY = this.y + diff[1];
     
        var newKey = newX + "," + newY;
        if (!(newKey in map)) { return; } // cannot move in this direction
            else if(map[newKey] == "#"){return;}    //Cannot move through walls (#s)

        socket.emit('somethingMoved',{what: name, newX : newX, newY : newY});
        
        window.removeEventListener("keydown", this);
/*
        var lightPasses = function(x,y){
            var key = x+","+y;
            if (key in map) {
                if(map[key] !== "#"){
                    return true; 
                }
                return false;
            }
            return false;
        };
        var fov = new ROT.FOV.RecursiveShadowcasting(lightPasses);
       
        display.clear();
        fov.compute180(x, y, 10, keyMap[code], function(x, y, r, visibility) {
            var ch = (r ? map[x+","+y] : "@");
            var color = (map[x+","+y] ? "#aa0": "#660");
            display.draw(x, y, ch);
        });
*/
        //engine.unlock();
    };
    this.update = function(newX,newY){
        this.x = newX;
        this.y = newY;
        this.draw();
    };
};