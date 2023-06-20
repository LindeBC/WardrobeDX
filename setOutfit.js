//script called when we want to change player's outfit

//function for setting player outfit
var data = JSON.stringify(outfit.data);

//injecting the code in a <script> element into the website DOM
var script = document.createElement("script");

var code = "Player.Wardrobe[24] = " + data + "; WardrobeFastLoad(Player, 24, true);" //this is a dirty workaround and should be replaced with a proper outfit loading function
script.appendChild(document.createTextNode(code));
document.body.appendChild(script);

//remove the <script> element after it's executed to keep them from piling up
document.body.removeChild(document.body.lastChild);