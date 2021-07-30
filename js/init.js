const myMap = L.map('mapArea').setView([34.0709, -118.444], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(myMap);

function addMarker(data){
        L.marker([data.lat,data.lng])
            .addTo(myMap)
            .bindPopup(`
                <h3>How much rent are you paying per month?: ${data.howmuchwillyoubespendingonrenthousingpermonththisyear}</h3>
                <h3>How has gender, sexual orientation, race and ethnicity, or class played a role in your housing experience?: ${data.howhasgendersexualorientationraceandethnicityorclassplayedaroleinyourhousingexperience}</h3>
                <h3>Housing-related difficulties: ${data.whatdifficultieshaveyouencounteredwhiletryingtofindhousingfortheupcomingschoolyear}</h3>
            `)
        return data.location   
}

let url = "https://spreadsheets.google.com/feeds/list/1ug3PYMrs2FgR3IFIi7wcr0N13Z0fIzUIoU478CRzgW8/onm9gki/public/values?alt=json"

fetch(url)
	.then(response => {
		return response.json();
		})
    .then(data =>{
        processData(data)
    })

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
    console.log(formattedData)
        formattedData.forEach(addMarker)
}

