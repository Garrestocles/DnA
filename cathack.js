//Global vars for Everyone
//Init Display
var w = 70;
var h = 25;
var display = new ROT.Display({spacing:1.4, width: w, height: h});
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
var selected = null;

var currentTurn;

var init = function (){
	name = document.forms[0].name.value;
	color = document.forms[0].color.value;

	var gameDataArea = document.getElementById("GameData");

	var radio = document.getElementsByName("master");
	for (var r = 0; r < radio.length; r++){
		if(radio[r].checked) master = radio[r].value;
	};

	document.forms[0].style.display = "none";
	document.getElementById("GameArea").appendChild(display.getContainer());
  document.getElementById("Selected").innerHTML = "Selected: ";
  gameDataArea.style.display = "inline-block";

	if(master === "yes"){
		masterSockets();
		createMap();

	    socket.emit('updateMap&Actors',{map : map, actors : actors, freeCells: freeCells});

      createCreatureMakerMenu(gameDataArea);
			createMapLoaderMenu(gameDataArea);

      window.addEventListener("keydown", function(e){
          if(selected !== null) actors[selected].handleEvent(e);
      });

	}else{
		clientSockets();
		socket.emit('player2init',"hi");
	}

  document.getElementById("GameArea").addEventListener("click",function (e){
	  var clickCoOrd = display.eventToPosition(e);
	  var found = false;

	  for(dude in actors){
	      if(actors[dude].x === clickCoOrd[0] && actors[dude].y === clickCoOrd[1]){
	          document.getElementById("Selected").innerHTML = "Selected: "+actors[dude].name +" <a href=javascript:smite('"+dude+"')>Delete?</a>";
	          selected = actors[dude].name;
	          found = true;
	      };
	  };
	  if(!found){
	      document.getElementById("Selected").innerHTML = "Selected: "+ clickCoOrd[0] + "," + clickCoOrd[1];
	      selected = null;
	  }

	});
};
var smite = function(object){
	display.draw(actors[object].x,actors[object].y,'.');
	delete actors[object];
};
var drawMap = function(){
	for (var key in this.map) {
	  var parts = key.split(",");
	  var x = parseInt(parts[0]);
	  var y = parseInt(parts[1]);
		this.map[key] === 'P' ? this.display.draw(x, y, '.') : this.display.draw(x, y, this.map[key]);
  };
};
socket.on('finishedTurn',function(data){
  var x = actors[data.what].x;
  var y = actors[data.what].y;
	//console.log(master);
	if(master !== "yes"){
		if(actors[name].tilesSeen[x+","+y]) display.draw(x, y, map[x+","+y]);
		if(actors[name].tilesSeen[data.newX+","+data.newY]) {
			actors[data.what].update(data.newX, data.newY);
		}else {
			actors[data.what].x = data.newX;
			actors[data.what].y = data.newY;
		};
	}else {
		display.draw(x, y, map[x+","+y]);
		actors[data.what].update(data.newX, data.newY);
	}
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
var loadMap = function(mapObj){
	map = {};
	for(coOrd in mapObj){
		map[coOrd] = mapObj[coOrd];
	}
	drawMap();
}
var createMap = function(){
	var mapLayout = new ROT.Map.Digger(w,h,[3,15],0.9);//I don't seem to understand these last 2 arguments
	freeCells = [];

	mapLayout.create(function(x,y,what){
		if (what === 1) {
      //display.draw(x,y,"#",null,"#777");
      var key = x+","+y;
      map[key] = "#";
      return;
    };
    var key = x+","+y;
    map[key] = ".";
    freeCells.push(key);
	}.bind(this));
	drawMap();
};

var Actor = function(xCoord,yCoord,name,color,rune){
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
    if (!(code in keyMap)) { return; }

    var diff = ROT.DIRS[8][keyMap[code]];
    var newX = this.x + diff[0];
    var newY = this.y + diff[1];

    var newKey = newX + "," + newY;
    if (!(newKey in map)) { return; } // cannot move in this direction
        else if(map[newKey] == "#"){return;}    //Cannot move through walls (#s)
    socket.emit('somethingMoved',{what: name, newX : newX, newY : newY});
  };
};
