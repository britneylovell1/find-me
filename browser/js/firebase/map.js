// variables
var map;
var geocoder;
var directionsService;
var directionsDisplay;


// Create a map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 40.7128, lng: -74.0059},
        zoom: 10
    });
    geocoder = new google.maps.Geocoder();
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map);

    google.maps.event.addListenerOnce(map, 'tilesloaded', function(){
        getUser();
    });
}

