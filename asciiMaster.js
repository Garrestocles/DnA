var createCreatureMakerMenu = function(GameDataArea){
  var creatureCreator = document.createElement("form");
  var nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "New Creature Name";
  var colorInput = document.createElement("input");
  colorInput.type = "text";
  colorInput.placeholder = "New Creature Color";
  var runeInput = document.createElement("input");
  runeInput.type = "text";
  runeInput.placeholder = "New Creature Rune";
  var xInput = document.createElement("input");
  xInput.type = "text";
  xInput.placeholder = "New Creature x Coord";
  var yInput = document.createElement("input");
  yInput.type = "text";
  yInput.placeholder = "New Creature y Coord";
  var doneInput = document.createElement("input");
  doneInput.type = "button";
  doneInput.value = "Create Creature";
  doneInput.addEventListener("click",function(){
      if(yInput.value === "" || xInput.value === ""){
          socket.emit('newActor', createCreature(Actor, freeCells, nameInput.value, colorInput.value, runeInput.value));
      }else{
          var dude = new Actor(parseInt(xInput.value),parseInt(yInput.value),nameInput.value, colorInput.value, runeInput.value);
          socket.emit('newActor', dude);
      }
  });
  creatureCreator.appendChild(nameInput);
  creatureCreator.appendChild(colorInput);
  creatureCreator.appendChild(runeInput);
  creatureCreator.appendChild(doneInput);
  creatureCreator.appendChild(xInput);
  creatureCreator.appendChild(yInput);
  GameDataArea.appendChild(creatureCreator);
};
var createMapLoaderMenu = function(GameDataArea){
  var mapLoader = document.createElement("form");
  var pickMapButton = document.createElement("input");
  pickMapButton.type = 'file';
  var loadMapButton = document.createElement("input");
  loadMapButton.type = 'button';
  loadMapButton.value = "Load Selected Map";
  loadMapButton.addEventListener("click",function(){
    var reader = new FileReader();
    var readFile;

    reader.onload = function(mapDna){
      readFile = JSON.parse(reader.result);

      console.log(readFile);

      map = readFile.map;
      freeCells = [];
      for(r = 0; r < w; r++){
        for(b = 0; b < h; b++){
          if(map[r+","+b] === 'P'){
            display.draw(r,b,'.');
            freeCells.push(r+","+b);
          }else
          display.draw(r,b,map[r+","+b]);
        }
      }
      socket.emit('updateMap&Actors',{map : map, actors : actors, freeCells: freeCells});
    };
    reader.readAsBinaryString(pickMapButton.files[0]);
  });
  mapLoader.appendChild(pickMapButton);
  mapLoader.appendChild(loadMapButton);
  GameData.appendChild(mapLoader);
};
var masterSockets = function (){
  socket.on('newPlayer',function (data){

      actors[data.name] = new Actor(data.x,data.y,data.name,data.color,data.rune);
  });
  socket.on('yourTurn',function (data){
      document.getElementById("WhoseTurn").innerHTML = "Current Turn: "+data.whoseTurn;
      currentTurn = data.whoseTurn;
  });
    socket.on('monotheism',function (data){
        confirm("THERE CAN ONLY BE ONE!");
        document.body.innerHTML="";
        document.head.innerHTML="";
    });
};
var createCreature = function(what, freeCells, thisName, thisColor, thisSymbol){
  var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
    var key = freeCells.splice(index, 1)[0];
    var parts = key.split(",");
    var x = parseInt(parts[0]);
    var y = parseInt(parts[1]);
    return new what(x, y, thisName, thisColor, thisSymbol);
};
