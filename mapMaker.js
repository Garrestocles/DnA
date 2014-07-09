var w = 70;
var h = 25;
var display = new ROT.Display({spacing:1.4, width: w, height: h});
var map = new Array(w);
for(r = 0; r < w; r++){
  map[r] = new Array(h);
}

function init(){
  document.getElementById("GameArea").appendChild(display.getContainer());
  initMap(map);

  document.getElementById("GameArea").addEventListener("click",function (e){

    var clickCoOrd = display.eventToPosition(e);

    map[clickCoOrd[0]][clickCoOrd[1]] = document.getElementById("tileType").Tile.value;
    display.draw(clickCoOrd[0],clickCoOrd[1],document.getElementById("tileType").Tile.value);

    console.log("Selected: "+ clickCoOrd[0] + "," + clickCoOrd[1]);
    console.log("Going to put a " + document.getElementById("tileType").Tile.value);
  });
}

function initMap(map){
  for(r = 0; r < w; r++){
    for(b = 0; b < h; b++){
      map[r][b] = '.';
      display.draw(r,b,'.');
    }
  }

}
