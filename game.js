var display = new ROT.Display({spacing:1.4});
var map = {};
var freeCells;

var scheduler;
var engine;
var socket = io.connect('http://localhost:1337');

var actors = {}; 

var master = true;

var init = function(){
	document.body.appendChild(display.getContainer());
	createMap();

    scheduler = new ROT.Scheduler.Simple();
    scheduler.add(actors["player"],true);
    scheduler.add(actors["cat"],true);
    engine = new ROT.Engine(scheduler);
    engine.start();
    /*
    var clientActors = [];
    for (actor in actors){
        clientActors.push({name: actor, x: actors[actor].x, y:actors[actor].y, rune : actors[actor].rune, color: actors[actor].color});
    }
    */
    socket.emit('updateMap&Actors',{map : map, actors : actors, freeCells: freeCells});
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
	actors["player"] = createCreature(Player, freeCells);
    actors["cat"] = createCreature(Cat, freeCells);
};

var drawMap = function(){
	for (var key in this.map) {
        var parts = key.split(",");
        var x = parseInt(parts[0]);
        var y = parseInt(parts[1]);
        this.display.draw(x, y, this.map[key]);
    }
};

var createCreature = function(what, freeCells){
	var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
    var key = freeCells.splice(index, 1)[0];
    var parts = key.split(",");
    var x = parseInt(parts[0]);
    var y = parseInt(parts[1]);
    return new what(x, y);
};
socket.on('finishedTurn',function(data){
    var x = actors[data.what].x;
    var y = actors[data.what].y;

    display.draw(x, y, map[x+","+y]);
    actors[data.what].update(data.newX, data.newY);
    
});
var Cat = function(xCoord,yCoord){
    this.x = xCoord;
    this.y = yCoord;
    this.rune = "f";
    this.color = "tan";
    

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
            if(map[newKey] == "#"){console.log("meow a wall");return;}    //Cannot move through walls (#s)
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
var Player = function(xCoord, yCoord) {
    this.x = xCoord;
    this.y = yCoord;
    this.rune = "@";
    this.color = "red";

    this.act = function(){
        
        engine.lock();
        //console.log(engine.isLocked());
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
socket.on('newPlayer',function (data){
    actors["player2"] = new RemoteActor(data.x,data.y,data.rune,data.color);
    scheduler.add(actors["player2"],true);
});
var RemoteActor = function(xCoord,yCoord,rune,color){
    this.x = xCoord;
    this.y = yCoord;
    this.rune = rune;
    this.color = color;

    this.draw = function(){
        display.draw(this.x,this.y,this.rune,this.color);
    };
    this.draw();
    this.act = function(){
        console.log("p2 turn");
        engine.lock();
        socket.emit('yourTurn');
    };
    this.update = function(newX,newY){
        this.x = newX;
        this.y = newY;
        this.draw();
        engine.unlock();
    };
};