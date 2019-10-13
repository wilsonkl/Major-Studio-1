var cnv;
const objectBaseUrl = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/';
var addToDOM = [];
function preload() {
    data = loadJSON('AJList.json');
    keys = loadJSON('keys.json');
}

function setup() {
    cnv = createCanvas(0, 0);
    tellStory();
}

var rnd = 1;

function draw(){
    if (frameCount % 270 == 0){
        highlight()
    }
    if (frameCount % rnd == 0){
        if (addToDOM.length > 0){
            addToDOM[0][0].html(addToDOM[0][1].charAt(0),true);
            if (addToDOM[0][1].length > 1) {
                addToDOM[0][1] = addToDOM[0][1].substr(1);
                rnd = round(random(1,10))
            } else {
                if (addToDOM[0][2]){addToDOM[0][0].html(addToDOM[0][2],false)};
                addToDOM.shift();
                rnd = 60;
            }
        }
    }

    document.getElementById('more').onclick = function() {
        console.log('lets start again')
        var wipe = select('#story')
        wipe.html('',false)
        addToDOM = [];
        lastKey = 'start';
        tellStory();
    }
}

var selectedSpan;

function highlight() {
    if (selectedSpan){
        selectedSpan.removeAttribute('id')
    }
    var allSpans = selectAll('span','story');
    selectedSpan = random(allSpans);
    selectedSpan.attribute('id', 'highlighted');

}

var key;
var lastKey = 'start';


function tellStory(){
    // Read adjacency list
            
    if (!key){
        key = keys[round(random(Object.keys(keys).length))];
    }

    // Create 100 links
    (async () => {
        var runStory = true;
        var used = []

        while (runStory == true){
            
            var span;
            let div = document.getElementById('story')

            span = createSpan('').parent(div);
            var toAdd = await makeSense(lastKey,key)
            if (toAdd) {
                toAdd.unshift(span)

                //check the length before adding it and story running the story
                var storyLen = document.getElementById('story').innerHTML.length;
                if ((storyLen + toAdd[1].length) < 350){
                    addToDOM.push(toAdd)
                    runStory = true;
                } else {
                    runStory = false;
                    key = lastKey;
                    lastKey = 'start';
                }
            }

            var spanClass;
            if (lastKey.split('-',1)[0] == 'objectID'){
                spanClass = key;
            } else {
                spanClass = lastKey;
            }

            // detect class type
            if (spanClass.split('-',1)[0] == 'artistBeginDate' || spanClass.split('-',1)[0] == 'artistEndDate' || spanClass.split('-',1)[0] == 'objectBeginDate') {
                span.addClass('date')
            };

            if (spanClass.split('-',1)[0] == 'tags' || spanClass.split('-',1)[0] == 'medium') {
                span.addClass('content')
            };

            if (spanClass.split('-',1)[0] == 'city' || spanClass.split('-',1)[0] == 'excavation' || spanClass.split('-',1)[0] == 'artistNationality') {
                span.addClass('geography')
            };


            // Remove Keys
            if (lastKey != 'start'){
                data[key].forEach((element,i) => {
                    if ( data[key][i] == lastKey) {
                        //console.log("removing " + lastKey + " from " + key);
                        data[key].splice(i, 1); 
                    }
                });
                
                data[lastKey].forEach((element,i) => { 
                    if ( data[lastKey][i] == key) {
                        //console.log("removing " + key + " from " + lastKey);
                        data[lastKey].splice(i, 1); 
                    }
                });
                
            }
            used.push(key.split('-')[1])
            lastKey = key;
            var tempKey;
            if (data[key].length > 0) {

                var high = 0;

                data[key].forEach((element,i) => {

                    var score = 0;
                    // create an element of randomness
                    score += round(random(1,5))
                    // add to the score
                    if (element.split('-',1)[0] == 'excavation') {
                        console.log('yay, excavation. have a +10')
                        score += 10
                    }
                    if (element.split('-',1)[0] == 'city') {
                        console.log('yay, we found a city. have a +9')

                        score += 9
                    }
                    if (element.split('-',1)[0] == 'artistNationality') {
                        console.log('yay, nationalities. have a +5')

                        score += 5
                    }
                    if (element.split('-',1)[0] == 'tags') {
                        score += 2
                    }

                    if (used.includes(element.split('-')[1])) {
                        console.log('boo, this has been used before. go back to zero')

                        score = 0;
                    }
                    if (element.split('-',1)[0] == key.split('-',1)[0]) {
                        console.log('literally the same as last time. go back to zero')

                        score = 0;
                    }

                     if (data[element].length < 5) {
                        score += data[element].length
                     } else {
                         score +=4
                     }

                    if (score > high){
                        high = score;
                        tempKey = element;
                    }
                });
                key = tempKey;
                console.log('newKey = ' + key);
            } else {
                console.log('there are no more links!');
                break;
            }
        }
        console.log('finised telling story');
        createSpan('.')
    })();

}

var first = false;

async function makeSense(from,to){
        
    var connectingString;

    if (from != 'start'){
        var getID;

        // work out if the 'from' or 'to' value is the objectID
        if (from.split('-')[0] == 'objectID') {
            getID = from.split('-')[1]
        } else {
            getID = to.split('-')[1]
        }

        //get the information about the item from the MET api
        const response = await fetch(objectBaseUrl + getID);
        var metObject = await response.json();

        // remove any square brackets surround the title
        metObject.title = metObject.title.replace(/[\[\]']+/g,'');
        // get rid of contents in brackets to shorten the title
        metObject.title = metObject.title.replace(/ *\([^)]*\) */g, "");
        if (String(metObject.objectBeginDate).substring(1) == '-'){
            metObject.objectBeginDate = String(metObject.objectBeginDate).substring(1,str.length) + 'BC';
        }

        //object to hold all of the correct sentences, either from the starting point of an object or a linking detail (for instance city or medium)
        var list = {};
        list.objectID = {
            objectID : '',
            artistDisplayName : [metObject.title + ' was created by ' + metObject.artistDisplayName + '.'],
            artistBeginDate : [metObject.title + ' was created by ' + metObject.artistDisplayName + ' who was born in ' + metObject.artistBeginDate + '.'],
            artistEndDate : [metObject.title + ' was created by ' + metObject.artistDisplayName + ' who died in ' + metObject.artistEndDate + '.'],
            objectBeginDate : [metObject.title + ' was created in ' + metObject.objectBeginDate + '.'],
            tags : [metObject.title + ' contains ' + to.split('-')[1] + '.'],
            artistNationality : [metObject.title + ' was created by ' + metObject.artistDisplayName + ' who was born in ' + to.split('-')[1] + '.'],
            excavation : [metObject.title + ' was excavated in ' + metObject.excavation + '.'],
            city : [metObject.title + ' was created in ' + metObject.city + '.'],
            medium: [metObject.title + ' was created using ' + metObject.medium + '.']
        };
        
        list.artistDisplayName = {objectID : [' ' + from.split('-')[1] + ' created ' + metObject.title + '. ',' ' + from.split('-')[1] + ' created <b><a href="' + metObject.objectURL + '" target="_blank">' + metObject.title + '. </a></b>']};
        list.artistBeginDate = {objectID : [' ' + from.split('-')[1] + ' is the same year that ' + metObject.artistDisplayName + ' was born, who created ' + metObject.title + '. ',' ' + from.split('-')[1] + ' is the same year that ' + metObject.artistDisplayName + ' was born, who created <b><a href="' + metObject.objectURL + '" target="_blank">' + metObject.title + '. </a></b>']};
        list.artistEndDate = {objectID : [' ' + from.split('-')[1] + ' is the same year that ' + metObject.artistDisplayName + ' died, who created ' + metObject.title + '. ',' ' + from.split('-')[1] + ' is the same year that ' + metObject.artistDisplayName + ' died, who created <b><a href="' + metObject.objectURL + '" target="_blank">' + metObject.title + '. </a></b>']};
        list.objectBeginDate = {objectID : [' ' + from.split('-')[1] + ' was also when ' + metObject.title + ' was created. ',' ' + from.split('-')[1] + ' was also when <b><a href="' + metObject.objectURL + '" target="_blank">' + metObject.title + '</a></b> was created. ']};
        list.tags = {objectID : [' ' + from.split('-')[1] + ' features in ' + metObject.artistDisplayName + '\'s ' + metObject.title + '. ',' ' + from.split('-')[1] + ' features in ' + metObject.artistDisplayName + '\'s <b><a href="' + metObject.objectURL + '" target="_blank">' + metObject.title + '. </a></b>']};
        list.artistNationality = {objectID : [' ' + from.split('-')[1] + ' is where ' + metObject.artistDisplayName + ' created ' + metObject.title + '. ',' ' + from.split('-')[1] + ' is where ' + metObject.artistDisplayName + ' created <b><a href="' + metObject.objectURL + '" target="_blank">' + metObject.title + '. </a></b>']};        
        list.excavation = {objectID : [' ' + from.split('-')[1] + ' is the same year that ' + metObject.title + ' was excavated. ',' ' + from.split('-')[1] + ' is the same year that <b><a href="' + metObject.objectURL + '" target="_blank">' + metObject.title + ' </a></b> was excavated. ']};       
        list.city = {objectID : [' ' + from.split('-')[1] + ' is where ' + metObject.title + ' was created. ',' ' + from.split('-')[1] + ' is where <b><a href="' + metObject.objectURL + '" target="_blank">' + metObject.title + '</a></b> was created. ']};     
        list.medium = {objectID : [' ' + from.split('-')[1] + ' was the same medium ' + metObject.artistDisplayName + ' used to create ' + metObject.title + '. ',' ' + from.split('-')[1] + ' was the same medium ' + metObject.artistDisplayName + ' used to create <b><a href="' + metObject.objectURL + '" target="_blank">' + metObject.title + '. </a></b>']};
        
        // object senstences dont have links by default but need one if it is the first sentence so add one.
        if (first == true){
            var x = list[from.split('-',1)[0]][to.split('-',1)[0]];

            x = x[0].substr(metObject.title.length);
            x = '<b><a href="' + metObject.objectURL + '" target="_blank">' + metObject.title + ' </a></b>' + x;

            list[from.split('-',1)[0]][to.split('-',1)[0]].push(x);

            // delete the word 'also' or 'same' from the first sentence
            list[from.split('-',1)[0]][to.split('-',1)[0]][0] = list[from.split('-',1)[0]][to.split('-',1)[0]][0].replace('same ', '');
            list[from.split('-',1)[0]][to.split('-',1)[0]][0] = list[from.split('-',1)[0]][to.split('-',1)[0]][0].replace('also ', '');
            list[from.split('-',1)[0]][to.split('-',1)[0]][1] = list[from.split('-',1)[0]][to.split('-',1)[0]][1].replace('same ', '');
            list[from.split('-',1)[0]][to.split('-',1)[0]][1] = list[from.split('-',1)[0]][to.split('-',1)[0]][1].replace('also ', '');
        }

        connectingString = list[from.split('-',1)[0]][to.split('-',1)[0]];
        first = false;
    } else {
        first = true;
    }

    return connectingString;
}