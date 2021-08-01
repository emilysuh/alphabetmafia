let circleOptions = {
    radius: 4,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
}

let clusterOptions = {
    showCoverageOnHover: false
}

const myMap = L.map('mapArea').setView([34.0709, -118.444], 11);

let answeredYes = L.markerClusterGroup(clusterOptions);
let answeredNo = L.markerClusterGroup(clusterOptions);


const boundaryLayer = "data/westwoodnotwestwood.geojson"
let boundary; // place holder for the data
let collected; // variable for turf.js collected points 
let allPoints = []; // array for all the data points
let boundaryGeom;

let url = "https://spreadsheets.google.com/feeds/list/1ug3PYMrs2FgR3IFIi7wcr0N13Z0fIzUIoU478CRzgW8/onm9gki/public/values?alt=json"


let layers = {
	"Queer/Trans": answeredYes,
	"Non-queer/trans": answeredNo
}

L.control.layers(null,layers).addTo(myMap)
fetch(url)
	.then(response => {
		return response.json();
		})
    .then(data =>{
        processData(data)
    })

function onEachFeature(feature, layer) {
    // console.log(feature.properties)
    if (feature.properties.values) {
        //count the values within the polygon by using .length on the values array created from turf.js collect
        let count = feature.properties.values.length
        // console.log(count) // see what the count is on click
        let text = `<strong>Area: </strong>`+feature.properties.NAME+`<br>`+`<strong>Number of survey responses: </strong>`+count // convert it to a string
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: layer.bindPopup()
        });
        layer.bindPopup(text); //bind the pop up to the number
    }
}
// for coloring the polygon
function getStyles(data){
    // console.log(data)
    let myStyle = {
        "color": "#ff7800",
        "weight": 1,
        "opacity": .0,
        "stroke": .25
    };
    if (data.properties.values.length > 0){
        myStyle.opacity = 0
        
    }

    return myStyle
}    
function countChecker(dataField,counts,yesCount,noCount){
    // Albert: OH NO!!! you didn't need to change dataField.support!!! the data field is already set to support!
    if (dataField == "Yes" && counts){
      // we have to return an array because JavaScript can only handle returning 1 object
      return [yesCount +=1,noCount]  // return this count value!
    }
    else if (dataField == "No" && counts){
      return [yesCount, noCount +=1] // return this count value!
    }
    
  }
  
  


function getBoundary(layer){
    fetch(layer)
    .then(response => {
        return response.json();
        })
    .then(boundarydata =>{
                //set the boundary to data
                boundary = boundarydata

                // run the turf collect geoprocessing
                collected = turf.collect(boundary, thePoints, 'surveyData', 'values');
                // just for fun, you can make buffers instead of the collect too:
                // collected = turf.buffer(thePoints, 50,{units:'miles'});
                // console.log(collected.features)

                // here is the geoJson of the `collected` result:
                boundaryGeom = L.geoJson(collected,{onEachFeature: onEachFeature,style:function(feature)
                {
                //    console.log(feature)
                    if (feature.properties.values.length > 0) {
                        let queerTransCounts = {
                            "YesCount":0,
                            "NoCount":0
                          }

                          feature.properties.values.forEach(
                            polygonData=>
                              { 
                                // console.log(polygonData)
                              let runningCount = countChecker(polygonData.queerortrans,queerTransCounts,queerTransCounts.YesCount,queerTransCounts.NoCount);
                              queerTransCounts.YesCount = runningCount[0];
                              queerTransCounts.NoCount = runningCount[1];
                              
                              
                              })
                          
                          // We finally set the polygon value `kTownResidentTotal` to residentCounts.kTownresidentCount
                          feature.properties.values.YesTotal = queerTransCounts.YesCount
                          
                          // We do the same for `nonResident total`
                          feature.properties.values.NoTotal = queerTransCounts.NoCount
    
                          // we can check our values here:
                        //   console.log('hi emily')
                        //   console.log(feature.properties.values)


                        // return {color: "blue",stroke: false};
                    }
                    else{
                        // make the polygon gray and blend in with basemap if it doesn't have any values
                        return{opacity:0,color:"#efefef" }
                    }
                }
                // add the geojson to the map
                    }).addTo(myMap)
        }
    )   
}


function processData(theData){
    const formattedData = [] 
    const rows = theData.feed.entry 
    for(const row of rows) { 
      const formattedRow = {}
      for(const key in row) {
        if(key.startsWith("gsx$")) {
              formattedRow[key.replace("gsx$", "")] = row[key].$t
        }
      }
      formattedData.push(formattedRow)
    }
    // console.log(formattedData)
        formattedData.forEach(addMarker)
        answeredYes.addTo(myMap)
        answeredNo.addTo(myMap)
        
        allLayers = L.featureGroup([answeredYes,answeredNo]);

        // step 1: turn allPoints into a turf.js featureCollection
        thePoints = turf.featureCollection(allPoints)
        // console.log(thePoints)

        // step 2: run the spatial analysis
        getBoundary(boundaryLayer)
        // console.log('boundary')
        // console.log(boundary)
        
        myMap.fitBounds(allLayers.getBounds());   

    }


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(myMap);


function addMeaningfulData(theData){
    let meaningfulData = ""
    if (theData.queerortrans){
        // console.log(theData.howmuchwillyoubespendingonrenthousingpermonththisyear)
        meaningfulData += `<h3>How much rent are you paying per month? </h3>${theData.rent}`
    }
    else{
        // console.log(theData)
        // console.log('no theData')
    }
    if (theData.impactonhousing){
        meaningfulData += `<h3>How has gender, sexual orientation, race and ethnicity, or class played a role in your housing experience?:</h3> ${theData.impactonhousing}`
    }
    if (theData.difficult){
        meaningfulData += `<h3>Housing-related difficulties: </h3>${theData.difficult}`
    }
    return meaningfulData
}


function addMarker(data){
    let surveyData = {
        "queerortrans":data.doyouidentifyasqueerortrans,
        "rent":data.howmuchwillyoubespendingonrenthousingpermonththisyear, 
        "impactonhousing":data.howhasgendersexualorientationraceandethnicityorclassplayedaroleinyourhousingexperience,
        "difficult":data.whatdifficultieshaveyouencounteredwhiletryingtofindhousingfortheupcomingschoolyear
      }
    let popUp = addMeaningfulData(surveyData)
    console.log('popUp')
    console.log(popUp)
    if (data.lat==0){
        data.lat = 34.0709
        data.lng = -118.444
        // console.log(`found a point without location: ${data.howhasgendersexualorientationraceandethnicityorclassplayedaroleinyourhousingexperience}`)
        
    }

    if (data.doyouidentifyasqueerortrans == "Yes"){
        circleOptions.fillColor = "green"
        answeredYes.addLayer(
            L.circleMarker([data.lat,data.lng],circleOptions)
        .bindPopup(popUp)
        )
    }  
    if (data.doyouidentifyasqueerortrans == "No"){
        circleOptions.fillColor = "red"
        answeredNo.addLayer(
            L.circleMarker([data.lat,data.lng],circleOptions)
        .bindPopup(popUp)
        )
    }

    surveyData.difficult
    let thisPoint = turf.point([Number(data.lng),Number(data.lat)],{surveyData})
    allPoints.push(thisPoint)
}



// // function to process the data and check if it matches the stateName passed in
// function areaCheck(data,areaName) {
//     // only return data if it matches the state name
//     if (areaName==data.properties.NAME){
//         // this is how the function returns the data
//         console.log(data)
//         return data
//     }
    
// }

// function updateContentsPanel(target,boundaryValues){
//     // use console.log to see what properties can be accessed
//     //console.log(boundaryValues)

//     // this is the variable for holding the resulting data from the areaCheck
//     let results=[]
//     let areaName = boundaryValues.NAME//

//     // this is the variable that temporary stores the data from areaCheck that
//     // we push into the results
//     let thisData;

//     // loop through all the points and run the areaCheck function
//     // we pass in the parameters of data and the current areaName
//     allPoints.forEach(data=>results.push(thisData = areaCheck(data,areaName)))
    
//     // filter out data the exist
//     let filtered = results.filter(function (data) {
//         return data != null;
//       });

//     // check to see if data is filtered
//     console.log(filtered)      
    
//     let count = boundaryValues.values.length
//     console.log('count')
    
//     // this the title HTML for the right side
//     target.innerHTML = `<div id="state">
//                             <h2>State: ${boundaryValues.NAME}</h2>
//                             <h3>Total incidents reported: ${count}</h3>
//                         </div>`
    
//     // sort by descending
//     let sorted = filtered.sort().reverse()

//     // used the sorted data to make the map
//     sorted.forEach(story=>addStory(story.properties,target))
// }



function highlightFeature(e) {
    var layer = e.target;
    //console.log('layer')
    //console.log(layer.feature.properties.values)
    let boundaryProperties = layer.feature.properties
    let divToUpdate = document.getElementById("contents")
    console.log('divToUpdate')
    console.log(divToUpdate)
    layer.setStyle({
        weight: 5,
        color: 'white',
        fillColor: 'white',
        dashArray: '',
        fillOpacity: 0.0,
        opacity: 0.0
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
    updateContentsPanel(divToUpdate,boundaryProperties)
}


function resetHighlight(e) {
    boundaryGeom.resetStyle(e.target);
}

function returnStories(thisStory,target){
    let thestory = addMeaningfulData(thisStory)
    console.log(thestory)
    target.innerHTML += thestory
    return thestory
}

// function to add the story with the target div
function addStory(story,target){
    console.log(story)
    target.innerHTML = ""
    // console.log(thisStory)
    story.forEach(thestory => returnStories(thestory,target))

    // target.innerHTML = `<div class="card">${thisStory}</div>`
    // target.innerHTML += `<div class="card">
    //                         <h3>Identify as queer or trans: ${story.queerortrans}</h3>
    //                         <p><strong>How much rent do you pay per month?: </strong>${story.rent}</p>
    //                         <p><strong>How has your gender, sexuality, race and ethnicity, nationality, or class affected your housing experience? ${story.impactonhousing}</p>
    //                         <p><strong>What difficulties have you encountered while trying to find housing for the school year?: </strong>${story.difficult}</p>
    //                     </div>`
}

function updateContentsPanel(target,boundaryValues){
    // console.log(target)
    console.log("boundaryValues array") 
    // console.log(boundaryValues)
    let dataInsideBoundary = boundaryValues.values

    // dataInsideBoundary.forEach(thisData => addStory(thisData,target))
    addStory(dataInsideBoundary,target)

}
