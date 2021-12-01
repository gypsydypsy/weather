/**** DOM ELEMENTS ****/

//Search
const openSearch = document.getElementById('open-search-window');
const closeSearch = document.getElementById('close-search-window');
const searchWindow = document.getElementById('search-window')
const searchBar = document.getElementById('search-bar')
const searchBtn = document.getElementById('search-button')
const suggest = document.getElementById('suggest')
const geolocationBtn = document.getElementById('geolocation');

//Current weather
const currentWeather = document.getElementById('current-weather')
const currentLocation = document.getElementById('current-location')

//Forecast
const forecast = document.getElementById('forecast-grid');

//Highlights
const highlights = document.getElementById('highlights-grid')

//Degree converter
let degreeBtns = document.querySelector('.converter').children;
let degreeUnit = 'celsius';

//Local storage
const savedCities = document.getElementById('saved-cities');
let cities = (localStorage.getItem('weatherAppCities')) ? JSON.parse(localStorage.getItem('weatherAppCities')) : [];

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sept', 'oct', 'nov', 'dec']


/**** FUNCS ****/

function openSearchWindow() {
    searchWindow.style.display = 'flex';
    getSavedCities();
} 

function closeSearchWindow() {
    searchWindow.style.display = 'none';
}

function setInputValue(data)
{
    searchBar.value = data;
}

function getInputValue(input)
{
    return input.value.toLowerCase().trim();
}

function saveCity(city){
    if (cities.indexOf(city) < 0){
        cities.push(city)
        localStorage.setItem('weatherAppCities', JSON.stringify(cities));
    }
}

function clearSavedCities(){
    cities = [];    
    localStorage.removeItem('weatherAppCities');
    savedCities.innerHTML = null;
    searchWindow.removeChild(searchWindow.lastChild);
}

function getSavedCities(e){
    savedCities.innerHTML = null;
    
    for (let city of JSON.parse(localStorage.getItem('weatherAppCities'))){
        savedCities.innerHTML += 
        `<li>${city}</li>`
    };

    if(cities.length > 0 && searchWindow.lastChild.localName != 'p'){
        let p = document.createElement('p');
        searchWindow.appendChild(p);
        p.innerHTML =   `<p id='clear-cities'>Clear saved cities</p>`;

        const clearCities = document.getElementById('clear-cities');
        clearCities.addEventListener('click', clearSavedCities)
    }
    
    for (let city of savedCities.children){
        city.addEventListener('click', (e) => {
            setInputValue(city.textContent);
            getWeather(e);
        })
    }
}

function switchDegreeUnit(e){
    //Switching css style
    for (let degreeBtn of degreeBtns){
        degreeBtn.classList.remove('selected')
    }
    e.target.classList.add('selected');
    
    degreeUnit = e.currentTarget.value;
    getWeather(e)
}

/**** API CALLS ****/

function autocomplete(e)
{
    suggest.innerHTML = null;
    let input = getInputValue(searchBar);

    if (e.keyCode == 13 )
    {
        getWeather(e);
    }

    if (input.length > 2){
        fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=5&minPopulation=50000&namePrefix=${input}&types=CITY`, 
            {
            "method": "GET",
            "headers": {
                "x-rapidapi-key": "c8e7314470msh0d69328fc562ca5p1da6f5jsnd14871ebbff5",
                "x-rapidapi-host": "wft-geo-db.p.rapidapi.com"
            }
        })
        .then(response => response.json())
        .then(function (results) {
            let cities = results.data;
            if(!cities) return;
            for (let city of cities)
            {
                let li = document.createElement('li');
                li.innerHTML = `${city.name}<span>${city.country}</span>`;
                suggest.appendChild(li);

                li.addEventListener('click', () => {
                    setInputValue(city.name);
                    getWeather(e),
                    closeSearchWindow();
                })             
            } 
        })
    }
}

function getWeather(e)
{
    let query = getInputValue(searchBar);

    e.preventDefault();
    
    fetch(`http://api.weatherapi.com/v1/forecast.json?key=2f210cbdcc784f79801124639212605&q=${query}&days=7&aqi=no&alerts=no`)
    .then(response => response.json())
    .then(function(results){
        
        //Error handling
        if(results.error){
            suggest.innerHTML = "<p style='color: red'>City not found</p>";
            return;
        }

        //Reinit
        currentWeather.innerHTML = null;
        currentLocation.innterHTML = null;
        forecast.innerHTML = null;
        suggest.innerHTML = null; 

        let unit = (degreeUnit == 'celsius') ? '°C' : '°F';
        
        // Current Weather
        let currentTemp = (degreeUnit == 'celsius') ? results.current.temp_c : results.current.temp_f;

        currentWeather.innerHTML += 
            `
            <img src=${'http:' + results.current.condition.icon} alt="">
            <p class='current-temp'>${currentTemp}<span>${unit}</span></p>
            <p>${results.current.condition.text}</p>
            `

        // Current location 
        currentLocation.innerHTML = 
            `
            <p>Today &bull;	${days[new Date().getDay()]}, ${new Date().getDate()}  ${months[new Date().getMonth()]}</p>
            <p class='current-city'>${results.location.name}</p>
            `

        // Forecast
        results.forecast.forecastday.forEach( day => {
            let date = new Date(day.date);
            date = days[date.getDay()];

            let minTemp = (degreeUnit == 'celsius') ? day.day.mintemp_c : day.day.mintemp_f;
            let maxTemp = (degreeUnit == 'celsius') ? day.day.maxtemp_c : day.day.maxtemp_f;

            forecast.innerHTML += 
            `
            <div>
                <h3>${date}</h3>
                    <img src=${'http:' + day.day.condition.icon} alt="">
                    <div class='forecast-temp'>
                        <span>${minTemp}${unit}</span>
                        <span>${maxTemp}${unit}</span>
                    </div>
            </div>
            `;
        });

        //Highlights
        highlights.innerHTML = 
        `
        <div>
            <h3>Wind Status</h3>
            <p class='highlights-data'>${results.current.wind_kph} <span>kmh</span></p>
            <p class='highlights-desc'>${results.current.wind_dir}</p>
        </div>
        <div>
            <h3>Humidity</h3>
            <p class='highlights-data'>${results.current.humidity} <span>%</span></p>
            <div class='bar-container'>
                <div style='width: ${results.current.humidity}%' id='humidity-bar'></div>
            </div>
        </div>
        <div>
            <h3>Visibility</h3>
            <p class='highlights-data'>${results.current.vis_km} <span>km</span></p>
        </div>
        <div>
            <h3>Air Pressure</h3>
            <p class='highlights-data'>${results.current.pressure_in} <span>in</span></p>
        </div>
        `   

        saveCity(query);
        closeSearchWindow();
    });
}

function geolocation(e){
    navigator.geolocation.getCurrentPosition(function(position) 
    {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${longitude}&lat=${latitude}`)            
            .then(response => response.json())
            .then(function(results){
                let city = results.features[0].properties.city;
                setInputValue(city);
                getWeather(e);
            })  
    }, error => {
        let city = 'paris'
        setInputValue(city);
        getWeather(e);

        const errorMsg = document.getElementById('errorMsg');
        errorMsg.style.display = 'flex';
        errorMsg.innerHTML = 
        `
            <p><strong>${error.message}</strong>, please use the searchbar to find your city</p>
            <span id='closeErrorMsg'>X</span>
        `;
   
        closeErrorMsg.addEventListener('click', () => {
            errorMsg.style.display = 'none';
        }) 
    })
}

/**** EVENTS ****/

openSearch.addEventListener('click', openSearchWindow)
closeSearch.addEventListener('click', closeSearchWindow)

searchBar.addEventListener('keyup', autocomplete);
searchBtn.addEventListener('click', getWeather);

window.addEventListener('load', geolocation);
geolocationBtn.addEventListener('click', geolocation);

for (let degreeBtn of degreeBtns){
    degreeBtn.addEventListener('click', switchDegreeUnit)
}