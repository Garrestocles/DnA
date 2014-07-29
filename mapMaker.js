var w = 70;
var h = 25;
var display = new ROT.Display({spacing:1.4, width: w, height: h});
var map ={};
var actors = {};

function init(){
  document.getElementById("GameArea").appendChild(display.getContainer());
  initMap(map);

  document.getElementById("GameArea").addEventListener("click",function (e){

    var clickCoOrd = display.eventToPosition(e);

    map[clickCoOrd[0]+","+clickCoOrd[1]] = document.getElementById("tileType").Tile.value;
    display.draw(clickCoOrd[0],clickCoOrd[1],document.getElementById("tileType").Tile.value);

    document.getElementById('SelectedCoOrd').innerHTML = "Selected: "+ clickCoOrd[0] + "," + clickCoOrd[1];
  });
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
      y: yCoOrd
    };
    display.draw(xCoOrd ,yCoOrd,rune,color );
  }


}

function mapSavedRes(){
  confirm(this.responseText);
}

function updateDataRealQuick(linkOnTheDL){
  linkOnTheDL.href="data:application/json,"+JSON.stringify({map: map, gameObj: actors});
  linkOnTheDL.download=document.getElementById("filename").value+".json";


}
