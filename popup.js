//Script resposible for popup logic
//Alias for console log to make testing code/trycatches much less ugly
const log = chrome.extension.getBackgroundPage().console.log;

//Get button references for setting listeners later
let saveAppearance = document.getElementById('saveAppearance');
let saveGroup = document.getElementById('saveGroup');
let importButton = document.getElementById('importButton');
let exportOutfits = document.getElementById('exportButton');
let listEdit = document.getElementById('listEdit');

//Get container reference for appending loaded outfits as a list
let outfitList = document.getElementById('outfitList');

//Get text input reference for getting name of outfit
let outfitName = document.getElementById('outfitName');
let groupName = document.getElementById('groupName');

//Matrix of outfit groups fetched from Chrome Storage
let groups = [{name: 'Ungrouped', outfits: [], accordion: 'open'}];

/*
card.addEventListener('dblclick', function (e) {
    card.classList.toggle('large');
});
*/

//Load saved outfits from chrome storage and create list
function createOutfitList() {
    //Getting outfits from storage
    chrome.storage.local.get('wardrobev2', function(result) {
        //Only want to run this if we find outfit data
        if(!(result.wardrobev2.length === 1 && result.wardrobev2[0].outfits.length === 0)) {
            document.getElementById('dataSync').style.display = 'none';
            document.getElementById('saved').style.display = 'block';
            groups = result.wardrobev2;
            //Iterate over our groups
            for(let i = 0; i < groups.length; i++) {
                let groupArea = document.createElement('div');
                groupArea.className = 'groupElement';

                //Create button for opening/collapsing group items
                let groupText = document.createElement('div');
                groupText.innerHTML = groups[i].name;
                groupText.className = 'groupName';
                groupText.dataset.group = i;
                groupText.dataset.doubleClicked = 'false';

                let groupAccordionIcon = document.createElement('img');
                groupAccordionIcon.className = 'accordionIcon';

                //Click handler for opening/collapsing group items
                groupText.onclick = function() {
                    if(this.dataset.doubleClicked === 'false') {
                        let target = this.dataset.group;
                        let currentOutfitList = document.getElementById('outfitList').childNodes;
                        let curGroupArea = this.parentNode;

                        if(curGroupArea.dataset.accordion === 'closed') {
                            this.getElementsByClassName('accordionIcon')[0].src = 'assets/arrow-up.png';
                            curGroupArea.dataset.accordion = 'open';
                            groups[target].accordion = 'open';
                        } else {
                            this.getElementsByClassName('accordionIcon')[0].src = 'assets/arrow-down.png';
                            curGroupArea.dataset.accordion = 'closed';
                            groups[target].accordion = 'closed';
                        }

                        for(let j = 0; j < currentOutfitList.length; j++) {
                            if(currentOutfitList[j].className === 'outfitElement' && currentOutfitList[j].childNodes[0].dataset.group === target) {
                                toggleDisplay(currentOutfitList[j]);
                            }
                        }
                        chrome.storage.local.set({wardrobev2: groups}, function() {
                        });
                    }
                }

                //Initialize group's accordion status
                if(groups[i].accordion === 'open') {
                    groupAccordionIcon.src = 'assets/arrow-up.png';
                    groupArea.dataset.accordion = 'open';
                } else {
                    groupAccordionIcon.src = 'assets/arrow-down.png';
                    groupArea.dataset.accordion = 'closed';
                }

                //Create button for removing group from storage. 
                //Move all outfits from that group to 'Ungrouped', and do not give 'Ungrouped' such a button
                let groupRemove = null;
                //Create text input and button for renaming a group. Do not give 'Ungrouped' these elements
                let groupRename = null;
                let groupRenameButton = null;
                if(groups[i].name !== 'Ungrouped') {
                    groupRemove = document.createElement('div');
                    groupRemove.className = 'groupRemove';
                    groupRemove.dataset.group = i;

                    //Add listener with function for removing group from storage
                    groupRemove.onclick = function() {
                        let ungroupIndex = -1;
                        for(let j = 0; j < groups.length; j++) {
                            if(groups[j].name === 'Ungrouped') {
                                ungroupIndex = j;
                                break;
                            }
                        }
                        //Put everything from the group we're removing into the Ungrouped group
                        groups[ungroupIndex].outfits.push(...groups[this.dataset.group].outfits);
                        groups.splice(this.dataset.group, 1);
                        refreshList();
                    }

                    let removeGroupIcon = document.createElement('img');
                    removeGroupIcon.src = 'assets/delete.svg';
                    groupRemove.appendChild(removeGroupIcon);

                    groupRename = document.createElement('input');
                    groupRename.type = 'text';
                    groupRename.maxLength = '23';
                    groupRename.style.display = 'none';
                    groupRename.classList.add('groupRename', 'rename');
                    groupRename.value = groups[i].name;

                    groupRenameButton = document.createElement('button');
                    groupRenameButton.style.display = 'none';
                    groupRenameButton.classList.add('groupRenameButton', 'renameButton');
                    groupRenameButton.dataset.group = i;

                    groupText.addEventListener('dblclick', function (e) {
                        let groupAreaImages = groupText.parentElement.getElementsByTagName('img');
                        if(groupText.dataset.doubleClicked === 'false') {
                            groupText.dataset.doubleClicked = 'true';
                            groupRename.style.display = 'block';
                            groupRenameButton.style.display = 'block';
                            groupText.style.fontSize = '0px';
                            for(let j = 0; j < groupAreaImages.length; j++) {
                                groupAreaImages[j].style.display = 'none';
                            }
                            groupRename.focus();
                            groupRename.select();
                        } else {
                            groupText.dataset.doubleClicked = 'false';
                            groupRename.style.display = 'none';
                            groupRenameButton.style.display = 'none';
                            groupText.style.fontSize = '13px';
                            for(let j = 0; j < groupAreaImages.length; j++) {
                                if(Array.from(groupAreaImages[j].classList).indexOf('groupOrganize') !== -1 && listEdit.dataset.clicked === 'unclicked') {
                                    groupAreaImages[j].style.display = 'none';
                                } else {
                                    groupAreaImages[j].style.display = 'block';
                                }
                            }
                        }
                    });

                    groupRenameButton.onclick = function() {
                        let newName = groupRename.value;
                        if(newName !== '' && newName.length <= 23) {
                            groups[this.dataset.group].name = newName;
                        }
                        refreshList();
                    }
                }

                //Create buttons for reordering groups
                let groupOrganizeUp = null;
                let groupOrganizeDown = null;
                //We only want to let the user move a group up if there's a space above it anyway
                if(i !== 0) {
                    groupOrganizeUp = document.createElement('img');
                    groupOrganizeUp.src = 'assets/caret-up.png';
                    groupOrganizeUp.classList.add('groupOrganize', 'up');
                    if(listEdit.dataset.clicked === 'unclicked') {
                        groupOrganizeUp.style.display = 'none';
                    }
                    groupOrganizeUp.dataset.group = i;

                    groupOrganizeUp.onclick = function() {
                        if(this.dataset.group > 0) {
                            let temp = groups[i];
                            groups[i] = groups[i - 1];
                            groups[i - 1] = temp;
                        } 
                        refreshList();
                    }
                }

                //We only want to let the user move a group down if there's a space below it anyway
                if(i !== groups.length - 1) {
                    groupOrganizeDown = document.createElement('img');
                    groupOrganizeDown.src = 'assets/caret-down.png';
                    groupOrganizeDown.classList.add('groupOrganize', 'down');
                    if(listEdit.dataset.clicked === 'unclicked') {
                        groupOrganizeDown.style.display = 'none';
                    }
                    groupOrganizeDown.dataset.group = i;

                    groupOrganizeDown.onclick = function() {
                        if(this.dataset.group < groups.length - 1) {
                            let temp = groups[i];
                            groups[i] = groups[i + 1];
                            groups[i + 1] = temp;
                        }
                        refreshList();
                    }
                }

                //Append all elements in order
                groupText.appendChild(groupAccordionIcon);
                if(groupRename) {
                    groupText.appendChild(groupRename);
                    groupText.appendChild(groupRenameButton);
                }
                if(groupOrganizeUp) {
                    groupArea.appendChild(groupOrganizeUp);
                }
                if(groupOrganizeDown) {
                    groupArea.appendChild(groupOrganizeDown);
                }
                groupArea.appendChild(groupText);
                if(groupRemove) {
                    groupArea.appendChild(groupRemove);
                }
                outfitList.appendChild(groupArea);

                //Iterate over the outfits in each group
                for(let j = 0; j < groups[i].outfits.length; j++) {
                    //Create container for outfit name and delete button
                    let item = document.createElement('div');
                    item.className = 'outfitElement';

                    //Check accordion status, and render element based on that
                    if(groups[i].accordion === 'open') {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }

                    //Create button for loading outfit
                    let outfitText = document.createElement('div');
                    outfitText.innerHTML = groups[i].outfits[j].name;
                    outfitText.className = 'outfitName';
                    outfitText.dataset.group = i;
                    outfitText.dataset.number = j;
                    outfitText.dataset.doubleClicked = 'false';

                    //Add listener with function for loading outfit
                    outfitText.onclick = function() {
                        let outfit = JSON.stringify(groups[this.dataset.group].outfits[this.dataset.number]);

                        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                            chrome.tabs.executeScript(
                                tabs[0].id,
                                {code: 'var outfit = ' + outfit + ';'}, //Execute this line to set outfit data for content script
                                function() {
                                    chrome.tabs.executeScript(
                                        tabs[0].id,
                                        {file: 'setOutfit.js'}
                                    );
                                }
                            );
                        });
                    }

                    //Create buttons for reordering outfit within groups
                    let outfitOrganizeDown = null;
                    let outfitOrganizeUp = null;
                    //We only want to let the user move an outfit up if there's a space above it anyway
                    if(j !== 0) {
                        outfitOrganizeUp = document.createElement('img');
                        outfitOrganizeUp.src = 'assets/caret-up.png';
                        outfitOrganizeUp.classList.add('outfitOrganize', 'up');
                        if(listEdit.dataset.clicked === 'unclicked') {
                            outfitOrganizeUp.style.display = 'none';
                        }
                        outfitOrganizeUp.dataset.group = i;
                        outfitOrganizeUp.dataset.number = j;

                        outfitOrganizeUp.onclick = function() {
                            if(this.dataset.number > 0) {
                                let temp = groups[i].outfits[j];
                                groups[i].outfits[j] = groups[i].outfits[j - 1];
                                groups[i].outfits[j - 1] = temp;
                            } 
                            refreshList();
                        }
                    }

                    //We only want to let the user move an outfit down if there's a space below it anyway
                    if(j !== groups[i].outfits.length - 1) {
                        outfitOrganizeDown = document.createElement('img');
                        outfitOrganizeDown.src = 'assets/caret-down.png';
                        outfitOrganizeDown.classList.add('outfitOrganize', 'down');
                        if(listEdit.dataset.clicked === 'unclicked') {
                            outfitOrganizeDown.style.display = 'none';
                        }
                        outfitOrganizeDown.dataset.number = j;
                        outfitOrganizeDown.dataset.group = i;

                        outfitOrganizeDown.onclick = function() {
                            if(this.dataset.number < groups[i].outfits.length - 1) {
                                let temp = groups[i].outfits[j];
                                groups[i].outfits[j] = groups[i].outfits[j + 1];
                                groups[i].outfits[j + 1] = temp;
                            }
                            refreshList();
                        }
                    }

                    //Create button for moving outfit between groups
                    let outfitMove = document.createElement('div');
                    outfitMove.className = 'outfitMove';
                    outfitMove.dataset.group = i;
                    outfitMove.dataset.number = j;
                    outfitMove.dataset.wasClicked = 'false';
                    if(listEdit.dataset.clicked === 'unclicked') {
                        outfitMove.style.display = 'none';
                    }

                    //Create option list for moving groups
                    let groupPicker = document.createElement('select');
                    groupPicker.className = 'groupPicker';
                    groupPicker.style.display = 'none';
                    let blankOption = document.createElement('option');
                    blankOption.hidden = true;
                    groupPicker.appendChild(blankOption);
                    for(let k = 0; k < groups.length; k++) {
                        let groupSelection = document.createElement('option');
                        groupSelection.dataset.group = k;
                        let groupSelectionText = document.createTextNode(groups[k].name);
                        groupSelection.appendChild(groupSelectionText);
                        groupPicker.appendChild(groupSelection);
                    }

                    //Add event handler for when user picks a group to move the outfit to
                    groupPicker.onchange = function() {
                        //Copy item from groups array, splice it out of its outfit array, and push it to new group
                        let curGroupIndex = groupPicker.parentNode.dataset.group;
                        let curOutfitIndex = groupPicker.parentNode.dataset.number;

                        let targetGroupIndex = this.options[this.selectedIndex].dataset.group;

                        let curOutfit = groups[curGroupIndex].outfits[curOutfitIndex];
                        groups[curGroupIndex].outfits.splice(curOutfitIndex, 1);
                        groups[targetGroupIndex].outfits.push(curOutfit);

                        refreshList();
                    }

                    //Add listener with function for moving outfit
                    outfitMove.onclick = function() {
                        let parentOutfit = this.parentNode;
                        let curTextDiv = parentOutfit.getElementsByClassName('outfitName')[0];
                        if(this.dataset.wasClicked === 'false') {
                            this.dataset.wasClicked = 'true';
                            curTextDiv.getElementsByClassName('groupPicker')[0].style.display = 'block';
                            let outfitTextNode = curTextDiv.firstChild;

                            //Hide all the stuff that's in the way
                            let upArrow = null;
                            let downArrow = null;
                            upArrow = parentOutfit.getElementsByClassName('outfitOrganize up')[0];
                            downArrow = parentOutfit.getElementsByClassName('outfitOrganize down')[0];

                            curTextDiv.removeChild(outfitTextNode);

                            if(downArrow) {
                                parentOutfit.removeChild(downArrow);
                            }

                            if(upArrow) {
                                parentOutfit.removeChild(upArrow);
                            }
                            curTextDiv.onclick = () => false;
                        } else {
                            this.dataset.wasClicked = 'false';
                            refreshList();
                        }
                    }

                    let moveIcon = document.createElement('img');
                    moveIcon.className = 'folderImage';
                    moveIcon.src = 'assets/folder.png';
                    outfitMove.appendChild(moveIcon);

                    //Create button for removing outfit from storage
                    let outfitRemove = document.createElement('div');
                    outfitRemove.className = 'outfitRemove';
                    outfitRemove.dataset.group = i;
                    outfitRemove.dataset.number = j;

                    //Add listener with function for removing outfit from storage
                    outfitRemove.onclick = function() {
                        groups[this.dataset.group].outfits.splice(this.dataset.number, 1);
                        refreshList();
                    }

                    let removeIcon = document.createElement('img');
                    removeIcon.src = 'assets/delete.svg';
                    outfitRemove.appendChild(removeIcon);

                    //Add input and button for renaming outfits on a double click
                    /*
                    outfitRename = document.createElement('input');
                    outfitRename.type = 'text';
                    outfitRename.maxLength = '23';
                    outfitRename.style.display = 'none';
                    outfitRename.classList.add('outfitRename', 'rename');
                    outfitRename.value = groups[i].outfits[j].name;

                    outfitRenameButton = document.createElement('button');
                    outfitRenameButton.style.display = 'none';
                    outfitRenameButton.classList.add('outfitRenameButton', 'renameButton');
                    outfitRenameButton.dataset.group = i;
                    outfitRenameButton.dataset.outfit = j;
                    
                    outfitText.addEventListener('dblclick', function (e) {
                        log('WE GOT TO THE DOUBLE CLICK');
                        let outfitAreaImages = outfitText.parentElement.getElementsByTagName('img');
                        if(outfitText.dataset.doubleClicked === 'false') {
                            outfitText.dataset.doubleClicked = 'true';
                            outfitRename.style.display = 'block';
                            outfitRenameButton.style.display = 'block';
                            outfitText.style.fontSize = '0px';
                            for(let k = 0; k < outfitAreaImages.length; k++) {
                                outfitAreaImages[k].style.display = 'none';
                            }
                            outfitRename.focus();
                            outfitRename.select();
                        } else {
                            outfitText.dataset.doubleClicked = 'false';
                            outfitRename.style.display = 'none';
                            outfitRenameButton.style.display = 'none';
                            outfitText.style.fontSize = '13px';
                            for(let k = 0; k < outfitAreaImages.length; k++) {
                                if(Array.from(outfitAreaImages[k].classList).indexOf('outfitOrganize') !== -1 && listEdit.dataset.clicked === 'unclicked') {
                                    outfitAreaImages[k].style.display = 'none';
                                } else {
                                    outfitAreaImages[k].style.display = 'block';
                                }
                            }
                        }
                    });

                    outfitRenameButton.onclick = function() {
                        let newName = outfitRename.value;
                        if(newName !== '' && newName.length <= 23) {
                            groups[this.dataset.group].outfits[this.dataset.outfit].name = newName;
                        }
                        refreshList();
                    }
                    */

                    //Append all elements in order
                    outfitText.appendChild(groupPicker);
                    //outfitText.appendChild(outfitRename);
                    //outfitText.appendChild(outfitRenameButton);
                    item.appendChild(outfitText);
                    if(outfitOrganizeDown) {
                        item.appendChild(outfitOrganizeDown);
                    }
                    if(outfitOrganizeUp) {
                        item.appendChild(outfitOrganizeUp);
                    }
                    item.appendChild(outfitMove);
                    item.appendChild(outfitRemove);
                    outfitList.appendChild(item);
                }   
            }
        } else {
            //If we didn't find data, we'll want to give the user an import window where they can paste outfit JSON
            document.getElementById('dataSync').style.display = 'block';
            document.getElementById('saved').style.display = 'none';
        }
    });
}

//Add listener for saving imported outfits all at once
importButton.onclick = function() {
    let textbox = document.getElementById('dataArea');
    let importedData;

    //This validation is all honestly really ugly, but it gets the job done
    //First we make sure this shite is JSON in the first place
    try {
        importedData = JSON.parse(textbox.value);
    } catch(err) {
        log(err);
        return;
    }

    //Now we check the format to see if it looks like outfit data
    if(Array.isArray(importedData)) {
        if(importedData[0] && importedData[0].data && importedData[0].data[0] && importedData[0].data[0].Color && importedData[0].data[0].Group) {
            //If we passed this check, we're looking at data from the old format
            for(let i = 0; i < importedData.length; i++) {
                if(importedData[i].name && importedData[i].data) {
                    groups[0].outfits.push(importedData[i]);
                }
            }
        } else if(importedData[0] && importedData[0].outfits && importedData[0].outfits[0] && importedData[0].outfits[0].data
            && importedData[0].outfits[0].data[0] && importedData[0].outfits[0].data[0].Color && importedData[0].outfits[0].data[0].Group) {
            //If we passed this check, we're looking at data from the new format
            groups = importedData;
        }
    }
    refreshList();
}

//Add listener with function for saving current outfit
saveAppearance.onclick = function() {
    //Only execute the code if outfit name isn't blank
    if(outfitName.value !== '' && outfitName.value.length <= 23) {
        //Execute content script for saving current outfit to chrome storage
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.executeScript(
                tabs[0].id,
                {file: 'getOutfit.js'}
            );
        });
    }
}

//Add listener with function for saving current group
saveGroup.onclick = function() {
    //Only execute the code if group name isn't blank
    if(groupName.value !== '' && groupName.value.length <= 23) {
        groups.push({name: groupName.value, outfits: [], accordion: 'open'});
        refreshList();
    }
}

//Add listener with function for allowing reorder of list items
listEdit.onclick = function() {
    if(this.dataset.clicked === 'unclicked') {
        Array.from(document.getElementsByClassName('groupOrganize')).forEach(element => element.parentElement.getElementsByClassName('groupName')[0].dataset.doubleClicked === 'false' ? element.style.display = 'block' : '');
        Array.from(document.getElementsByClassName('outfitOrganize')).forEach(element => element.style.display = 'block');
        Array.from(document.getElementsByClassName('outfitMove')).forEach(element => element.style.display = 'block');
        this.dataset.clicked = 'clicked';
        this.style.transform = 'scaleX(-1)';
        document.getElementById('listEditTooltip').textContent = 'Hide';
    } else {
        Array.from(document.getElementsByClassName('groupOrganize')).forEach(element => element.style.display = 'none'/*element.parentElement.getElementsByClassName('groupName')[0].dataset.doubleClicked === 'false' ? element.style.display = 'none' : ''*/);
        Array.from(document.getElementsByClassName('outfitOrganize')).forEach(element => element.style.display = 'none');
        Array.from(document.getElementsByClassName('outfitMove')).forEach(element => element.style.display = 'none');
        this.dataset.clicked = 'unclicked';
        this.style.transform = 'scaleX(1)';
        document.getElementById('listEditTooltip').textContent = 'Edit List';
    }
}

function refreshList() {
    //Push the array to chrome storage
    chrome.storage.local.set({wardrobev2: groups}, function() {
    });

    //Clear outfit list and reload it
    outfitList.innerHTML = '';
    createOutfitList();
}

function toggleDisplay(toggledDiv) {
    if(toggledDiv.style.display === 'none') {
        toggledDiv.style.display = 'block';
    } else {
        toggledDiv.style.display = 'none';
    }
}

exportOutfits.onclick = function() {
    copyTextToClipboard(JSON.stringify(groups));
    this.textContent = 'Copied to clipboard!';
}

//Create outfit list
createOutfitList();

//Listener for getting messages sent by content script
chrome.runtime.onMessage.addListener(function(request, sender) {

    if (sender.tab) {        
        if(request.type == 'playerOutfit') {
            //Create new outfit element and add it to outfits array
            let outfit = {name: outfitName.value, data: request.outfit};
            let ungroupIndex = -1;
            for(let i = 0; i < groups.length; i++) {
                if(groups[i].name === 'Ungrouped') {
                    ungroupIndex = i;
                    break;
                }
            }
            groups[ungroupIndex].outfits.push(outfit);
            refreshList();
        }
    }
});

//Tab controls
let buttons = document.getElementsByClassName('tablinks');

for(let j = 0; j < buttons.length; j++) {
    buttons[j].addEventListener('click', function() { 
        let tabs = document.getElementsByClassName('tab');
        for (let i = 0; i < tabs.length; i++) {
            tabs[i].style.display = 'none';
        }
    
        let tablinks = document.getElementsByClassName('tablinks');
        for (let i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(' active', '');
        }
        document.getElementById(this.id + 'Tab').style.display = 'block';
        this.className += ' active';
    });
}

function copyTextToClipboard(text) {
    //Create a textbox field where we can insert text to. 
    let copyFrom = document.createElement('textarea');
  
    //Set the text content to be the text you wished to copy.
    copyFrom.textContent = text;
  
    //Append the textbox field into the body as a child. 
    //'execCommand()' only works when there exists selected text, and the text is inside 
    //document.body (meaning the text is part of a valid rendered HTML element).
    document.body.appendChild(copyFrom);
  
    //Select all the text!
    copyFrom.select();
  
    //Execute command
    document.execCommand('copy');
  
    //(Optional) De-select the text using blur(). 
    copyFrom.blur();
  
    //Remove the textbox field from the document.body, so no other JavaScript nor 
    //other elements can get access to this.
    document.body.removeChild(copyFrom);
}