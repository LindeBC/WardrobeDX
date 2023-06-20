//script called when we want to get the players' outfit in order to 
//save it in the local storage

//function for getting player outfit and sending it to the content script
function main() {
    var outfit = Player.Appearance
        .filter(a => a.Asset.Group.Category == "Appearance")
        .map(WardrobeAssetBundle)

    //sending the data from webpage to contentscript
    outfit = JSON.parse(JSON.stringify(outfit));

    var data = {
        type: "playerOutfit",
        outfit: outfit,
        name: Player.Name
    }
    window.postMessage(data, "*");
}

//injecting the code in a <script> element into the website DOM
var script = document.createElement("script");
script.appendChild(document.createTextNode('('+ main +')();'));
document.body.appendChild(script);

//remove the <script> element after it's executed to keep them from piling up
document.body.removeChild(document.body.lastChild);