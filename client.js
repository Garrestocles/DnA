var clientSockets = function (){
  socket.on('newPlayer',function (data){
    if(data.name !== name)
        actors[data.name] = new Actor(data.x,data.y,data.name,data.color,data.rune);
  });
  socket.on('yourTurn',function(data){
    document.getElementById("WhoseTurn").innerHTML = "Current Turn: "+data.whoseTurn;
    currentTurn = data.whoseTurn;
    if(data.whoseTurn === name)
        actors[name].act();
  });
  socket.on('initData',function (data){
    map = data.map;
    actors = data.actors;
    freeCells = data.freeCells;

    drawMap();

    for (actor in data.actors){
      actors[actor] = new Actor(data.actors[actor].x,data.actors[actor].y,data.actors[actor].name,data.actors[actor].color,data.actors[actor].rune);
    };

    var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
      var key = freeCells.splice(index, 1)[0];
      var parts = key.split(",");
      var x = parseInt(parts[0]);
      var y = parseInt(parts[1]);
    actors[name] = new Player2(x,y,color,name);
    socket.emit('newPlayer',actors[name]);
    window.addEventListener("keydown", actors[name]);
  });
  socket.on('updateData',function (data){
    console.log('updateData');
    map = data.map;
    actors = data.actors;
    freeCells = data.freeCells;

    drawMap();

    for (actor in data.actors){
      actors[actor] = new Actor(data.actors[actor].x,data.actors[actor].y,data.actors[actor].name,data.actors[actor].color,data.actors[actor].rune);
    };

    var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
      var key = freeCells.splice(index, 1)[0];
      var parts = key.split(",");
      var x = parseInt(parts[0]);
      var y = parseInt(parts[1]);
    actors[name] = new Player2(x,y,color,name);
    socket.emit('newPlayer',actors[name]);
    window.addEventListener("keydown", actors[name]);
  });
};

var Player2 = function(xCoord, yCoord, color, name) {
    this.x = xCoord;
    this.y = yCoord;
    this.rune = "@";
    this.color = color;
    this.name = name;

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

      if (!(code in keyMap)) { return; }

      var diff = ROT.DIRS[8][keyMap[code]];
      var newX = this.x + diff[0];
      var newY = this.y + diff[1];

      var newKey = newX + "," + newY;
      if (!(newKey in map)) { return; } // cannot move in this direction
          else if(map[newKey] == "#"){return;}    //Cannot move through walls (#s)

      socket.emit('somethingMoved',{what: name, newX : newX, newY : newY});

      this.sight();
    };
    this.sight = function(){
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
      fov.compute(this.x, this.y, 50, function(x, y, r, visibility) {
          var ch = (r ? map[x+","+y] : "@");
          var color = (map[x+","+y] ? "#aa0": "#660");
          var alreadyDrew = false;
          for(dude in actors){
            if(actors[dude].x === x && actors[dude].y === y){
              actors[dude].draw();
              alreadyDrew = true;
            }
          };
          if(!alreadyDrew) display.draw(x, y, ch);
      });
    };
    this.sight();
    this.update = function(newX,newY){
        this.x = newX;
        this.y = newY;
        this.draw();
    };
};
