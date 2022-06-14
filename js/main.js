mapboxgl.accessToken = 'pk.eyJ1IjoiZGFuaHRyYW4yNzExIiwiYSI6ImNsM3lqeTRyYjA4cTAzZHB4dWd1ZHJnaXIifQ.WzZqzQcVBE_weBaODCFofw';

const truckLocation = [106.795242, 10.880591];
const centerLocation = [106.795242, 10.880591];
const lastAtRestaurant = 0;
let keepTrack = [];
const pointHopper = {};

const map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/mapbox/streets-v11', // style URL
  center: truckLocation, // starting position [lng, lat]
  zoom: 14 // starting zoom
});

var coordinatesArray = [];
var countEmpty = 0;
var countFull = 0;
const warehouse = turf.featureCollection([turf.point(centerLocation)]);

// Create an empty GeoJSON feature collection for drop off locations
const dropoffs = turf.featureCollection([]);

// Create an empty GeoJSON feature collection, which will be used as the data source for the route before users add any new data
const nothing = turf.featureCollection([]);

map.on('load', async () => {
const marker = document.createElement('div');
marker.classList = 'truck';

// Create a new marker
new mapboxgl.Marker(marker).setLngLat(truckLocation).addTo(map);

// Create a circle layer
map.addLayer({
	id: 'warehouse',
	type: 'circle',
	source: {
	data: warehouse,
	type: 'geojson'
	},
	paint: {
	'circle-radius': 20,
	'circle-color': 'white',
	'circle-stroke-color': '#3887be',
	'circle-stroke-width': 3
	}
});

// Create a symbol layer on top of circle layer
map.addLayer({
	id: 'warehouse-symbol',
	type: 'symbol',
	source: {
	data: warehouse,
	type: 'geojson'
	},
	layout: {
	'icon-image': 'grocery-15',
	'icon-size': 1
	},
	paint: {
	'text-color': '#3887be'
	}
});

map.addLayer({
	id: 'dropoffs-symbol',
	type: 'symbol',
	source: {
	data: dropoffs,
	type: 'geojson'
	},
	layout: {
	'icon-allow-overlap': true,
	'icon-ignore-placement': true,
	'icon-image': 'marker-15'
	}
});

map.addSource('route', {
	type: 'geojson',
	data: nothing
});

map.addLayer(
	{
	id: 'routeline-active',
	type: 'line',
	source: 'route',
	layout: {
		'line-join': 'round',
		'line-cap': 'round'
	},
	paint: {
		'line-color': '#3887be',
		'line-width': ['interpolate', ['linear'], ['zoom'], 12, 3, 22, 12]
	}
	},
	'waterway-label'
);

map.addLayer(
	{
	id: 'routearrows',
	type: 'symbol',
	source: 'route',
	layout: {
		'symbol-placement': 'line',
		'text-field': '▶',
		'text-size': [
		'interpolate',
		['linear'],
		['zoom'],
		12,
		24,
		22,
		60
		],
		'symbol-spacing': [
		'interpolate',
		['linear'],
		['zoom'],
		12,
		30,
		22,
		160
		],
		'text-keep-upright': false
	},
	paint: {
		'text-color': '#3887be',
		'text-halo-color': 'hsl(55, 11%, 96%)',
		'text-halo-width': 3
	}
	},
	'waterway-label'
);

});

document.getElementById('map-direction').onclick =addWaypoints

async function addWaypoints() {
await newDropoff(coordinatesArray);
updateDropoffs(dropoffs);
}


async function newDropoff(coordinatesArray) {
coordinatesArray.forEach(function(coordinates) {
	const pt = turf.point([coordinates.lng, coordinates.lat], {
		orderTime: Date.now(),
		key: Math.random()
	});
	dropoffs.features.push(pt);
	pointHopper[pt.properties.key] = pt;
})

// Make a request to the Optimization API
const query = await fetch(assembleQueryURL(), { method: 'GET' });
const response = await query.json();
getInstructions(response.trips[0]);
// Create an alert for any requests that return an error
if (response.code !== 'Ok') {
	const handleMessage =
	response.code === 'InvalidInput'
		? 'Refresh to start a new route. For more information: https://docs.mapbox.com/api/navigation/optimization/#optimization-api-errors'
		: 'Try a different point.';
	console.error(`${response.code} - ${response.message}\n\n${handleMessage}`);
	// Remove invalid point
	dropoffs.features.pop();
	delete pointHopper[pt.properties.key];
	return;
}

// Create a GeoJSON feature collection
const routeGeoJSON = turf.featureCollection([
	turf.feature(response.trips[0].geometry)
]);

// Update the `route` source by getting the route source
// and setting the data equal to routeGeoJSON
map.getSource('route').setData(routeGeoJSON);
}

function updateDropoffs(geojson) {
map.getSource('dropoffs-symbol').setData(geojson);
}

// Here you'll specify all the parameters necessary for requesting a response from the Optimization API
function assembleQueryURL() {
// Store the location of the truck in a variable called coordinates
const coordinates = [truckLocation];
const distributions = [];
let restaurantIndex;
keepTrack = [truckLocation];


const restJobs = Object.keys(pointHopper).map(
	(key) => pointHopper[key]
);


if (restJobs.length > 0) {

	const needToPickUp =
	restJobs.filter((d) => d.properties.orderTime > lastAtRestaurant)
		.length > 0;


	if (needToPickUp) {
	restaurantIndex = coordinates.length;

	coordinates.push(centerLocation);

	keepTrack.push(pointHopper.warehouse);
	}

	for (const job of restJobs) {
	// Add dropoff to list
	keepTrack.push(job);
	coordinates.push(job.geometry.coordinates);

	if (needToPickUp && job.properties.orderTime > lastAtRestaurant) {
		distributions.push(
		`${restaurantIndex},${coordinates.length - 1}`
		);
	}
	}
}

// Set the profile to `driving`
// Coordinates will include the current location of the truck,
	return `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordinates.join(';')}
			?distributions=${distributions.join(';')}
			&overview=full&steps=true&geometries=geojson&source=first&access_token=${mapboxgl.accessToken}`;
}


function getInstructions(data) {

	const directions = document.getElementById('directions');
	let tripDirections = '';

	for (const leg of data.legs) {
	const steps = leg.steps;
		for (const step of steps) {
			tripDirections += `<li>${step.maneuver.instruction}</li>`;
		}
	}
	document.getElementById('route-time').innerText = Math.floor(data.duration / 60)
	document.getElementById('route-length').innerText = Math.floor(data.distance)
	directions.innerHTML = `<ol>${tripDirections}</ol>`;
	}


var tableRef = document.getElementById('myTable').getElementsByTagName('tbody')[0];

const getDevice = "http://localhost:3000/device/getAll";
function renderDevice(){
  fetch(getDevice, {mode: 'cors'})
  .then(function (response) {
    return response.json();
  })
  .then(function (datas) {
    datas.forEach(function (data, index) {
		var deviceRender;
		var deviceName = data.name;
		if(data.status==1) {
			coordinatesArray.push(new mapboxgl.LngLat(data.address.longitude, data.address.latitude));
		}
		const assembleQueryURL = `https://api.mapbox.com/geocoding/v5/mapbox.places/${data.address.longitude},${data.address.latitude}.json?access_token=${mapboxgl.accessToken}`
		fetch(assembleQueryURL).then(response => response.json()).then(function(response) {4
			console.log(response)
			var deviceDes = response.features.find(x => x.id.includes("locality"));
			var deviceAddress = deviceDes.place_name;
			if(data.status==1) {
				var deviceStatus = `<i class="fa-solid fa-trash"></i>   Đầy!`
				deviceRender = `<tr><td>${index+1}</td><td>${deviceName}</td><td>lng: ${data.address.longitude}</br>lat: ${data.address.latitude}</td><td>${deviceAddress}</td><td style="color:#FF0000">${deviceStatus}</td></tr>`
				new mapboxgl.Marker({ "color": "#FF0000" }).setLngLat([data.address.longitude, data.address.latitude]).addTo(map);
				countFull++;
			}
			else
			{
				var deviceStatus = `<i class="fa-solid fa-trash-arrow-up"></i>   Rỗng!`
				deviceRender = `<tr><td>${index+1}</td><td>${deviceName}</td><td>lng: ${data.address.longitude}</br>lat: ${data.address.latitude}</td><td>${deviceAddress}</td><td style="color:#00FF00">${deviceStatus}</td></tr>`
				new mapboxgl.Marker({ "color": "#00FF00" }).setLngLat([data.address.longitude, data.address.latitude]).addTo(map);
				countEmpty++;
			}
			var newRow = tableRef.insertRow(tableRef.rows.length);
			newRow.innerHTML = deviceRender;
		}).then(function() {
			document.getElementById('num-empty-bin').innerText=countEmpty;
			document.getElementById('num-full-bin').innerText=countFull;
		});
	});
	addWaypoints()
})
.then(function() {
	
})
.catch(function (error) {
  });
}

renderDevice()

