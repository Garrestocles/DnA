var display = new ROT.Display({spacing:1.4});
var map = {};

var socket = io.connect(window.location.origin);

var actors = {};
var freeCells;
var master = false;

var name;
var color;
//var realm;

var init = function(){
	console.log("initing data");
	
    document.forms[0].style.display = "none";
    name = document.forms[0].elements[0].value;
    color = document.forms[0].elements[1].value;
    //realm = document.forms[0].elements[2].value;

    
    socket.emit('player2init',"hi");
};
socket.on('initData',function (data){
	map = data.map;
	actors = data.actors;
	freeCells = data.freeCells;

	document.body.appendChild(display.getContainer());
	drawMap();

	console.log(actors);
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
var drawMap = function(){
	console.log("drawing map");
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
socket.on('yourTurn',function(data){
    document.getElementById("WhoseTurn").innerHTML = data.whoseTurn + "'s Turn";
    if(data.whoseTurn === name)
        actors[name].act();
    
});
socket.on('newPlayer',function (data){
    //console.log(data.name);
    if(data.name !== name)
        actors[data.name] = new Actor(data.x,data.y,data.rune,data.color,data.name);
});
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