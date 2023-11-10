import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import moment from "moment-timezone";
import 'dotenv/config';

const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));

app.get("/" , (req,res) => {
    res.render("index.ejs");
})

const GeoNames_Username = process.env.GeoNames_Username;
const rapid_api_key = process.env.rapid_api_key;

app.post("/submit" , async (req,res) => {

    const location = req.body.location

    try {

        // 1. Weather by API-Ninjas - It takes the city name as input to get temperature, humidity and wind speed.  

	    const weather = await axios.get('https://weather-by-api-ninjas.p.rapidapi.com/v1/weather', {

            params: {
                city : location,      // Passing the user text input.  
            },
        
            headers: {
                'X-RapidAPI-Key': rapid_api_key,
                'X-RapidAPI-Host': 'weather-by-api-ninjas.p.rapidapi.com'
            }

        });

        // To get all the information from the above api => console.log(weather.data);   

        // 2. GeoNames API - It takes the city name as input to get the country name of that city.

        const geolocation = await axios.get(`http://api.geonames.org/searchJSON?username=${GeoNames_Username}&q=` + location);

        // To get all the information from the above api => console.log(geolocation.data.geonames[0]); we have used geonames[0] since there could be many results. Considering, the first result is the most accurate.
        console.log(geolocation.data.geonames[0]);

        // 3. GeoNames API - It takes the latitude and longitude of the city as input. We are taking the latitude and longitude from the 2nd API call and passing it here as input. 

        const latitude = geolocation.data.geonames[0].lat;
        const longitude = geolocation.data.geonames[0].lng;

        const timezone = await axios.get(`http://api.geonames.org/timezoneJSON?formatted=true&username=${GeoNames_Username}&lat=${latitude}&lng=${longitude}`);
        
        // To get all the information from the above api => console.log(timezone.data);

        
        // 4. moment-timezone - It is an npm library which gives the time based on the timezone [ moment.tz( {timezone} ); ]. We are taking the timezone from the 3rd API call and passsing it here.

        const location_timezone = timezone.data.timezoneId;

        const currentTime = moment().tz(`${location_timezone}`);
        const location_time = currentTime.format('hh:mm A');

        res.render("index.ejs",{
            city : location,
            country : geolocation.data.geonames[0].countryName,
            time : location_time,
            temperature : weather.data.temp,
            humidity : weather.data.humidity,
            wind_speed : Math.floor(weather.data.wind_speed),
            precipitation : weather.data.cloud_pct
        });

    }

    catch (error) {
	    console.error(error);
    }

});

app.listen(port , ()=>{
    console.log(`Server is listening on port ${port}`);
})