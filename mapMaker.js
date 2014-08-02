var w = 70;
var h = 25;
var display = new ROT.Display({spacing:1.4, width: w, height: h});
var map ={};
var actors = {};
var mousedown = false;
var selected;

function init(){
  var gameArea = document.getElementById("GameArea");
  gameArea.appendChild(display.getContainer());
  initMap(map);

  gameArea.addEventListener("mousedown",function(e){
    mousedown = true;
    mouseUsed(display.eventToPosition(e));
  });
  gameArea.addEventListener("mouseup",function(){
    mousedown = false;
  });

  gameArea.addEventListener("mousemove",function (e){
    if(mousedown){
      mouseUsed(display.eventToPosition(e));
    }
  });
}

function mouseUsed(clickCoOrd){
  var mouseType = document.getElementById("tileType").Tile.value;
  if(mouseType !== 'selector'){
    map[clickCoOrd[0]+","+clickCoOrd[1]] = mouseType;
    display.draw(clickCoOrd[0],clickCoOrd[1],mouseType);
  }
  var found = false;

  for(var dude in actors){
      if(actors[dude].x === clickCoOrd[0] && actors[dude].y === clickCoOrd[1]){
          document.getElementById('SelectedCoOrd').innerHTML = "Selected: "+dude +" <a href=javascript:smite('"+dude+"')>Delete?</a>";
          selected = dude;
          found = true;
      };
  };
  if(!found){
    document.getElementById('SelectedCoOrd').innerHTML = "Selected: "+ clickCoOrd[0] + "," + clickCoOrd[1];
    selected = null;
  }
}
function smite(object){
  display.draw(actors[object].x,actors[object].y,'.');
  delete actors[object];
}
function initMap(map){
  for(r = 0; r < w; r++){
    for(b = 0; b < h; b++){
      map[r+","+b] = '.';
      display.draw(r,b,'.');
    }
  }
}
function createThing(){
  var name = document.forms[1].elements[0].value;
  var color = document.forms[1].elements[1].value;
  var rune = document.forms[1].elements[2].value;
  var xCoOrd = parseInt(document.forms[1].elements[3].value);
  var yCoOrd = parseInt(document.forms[1].elements[4].value);

  if(actors[name] !== undefined){
    alert("Something is already named "+name+"!")
  }else{
    actors[name] = {
      color: color,
      rune: rune,
      x: xCoOrd,
      y: yCoOrd,
      name: name
    };
    display.draw(xCoOrd ,yCoOrd,rune,color );
  }
}

function loadMap(mapDnA){
  console.log("loadMap");
  var reader = new FileReader();
  var readFile;

  reader.onload = function(mapDna){
    readFile = JSON.parse(reader.result);

    console.log(typeof readFile);

    map = readFile.map;
    actors = readFile.gameObj;
    for(r = 0; r < w; r++){
      for(b = 0; b < h; b++){
        display.draw(r,b,map[r+","+b]);
      }
    }
    for(var name in actors){
      display.draw(actors[name].x,actors[name].y,actors[name].rune,actors[name].color);
    }
  };
  reader.readAsBinaryString(mapDnA);

}

function updateDataRealQuickLike(linkOnTheDL){
  linkOnTheDL.href="data:application/json,"+JSON.stringify({map: map, gameObj: actors});
  linkOnTheDL.download=document.getElementById("filename").value+".json";
}
