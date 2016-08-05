// Initialize Firebase
var config = {
    apiKey: "AIzaSyAFYUbp7_QhaiMIQN3Iwk54dXMxQJ8kM_o",
    authDomain: "gh-find-me.firebaseapp.com",
    databaseURL: "https://gh-find-me.firebaseio.com",
    storageBucket: "gh-find-me.appspot.com",
};

firebase.initializeApp(config);

firebase.auth().signInAnonymously().catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorMessage);
});

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // User is signed in.
        var isAnonymous = user.isAnonymous;
        var uid = user.uid;

        console.log(uid);

        updateCoordinates(uid, 21, 20);

        firebase.database().ref('users/' + uid).onDisconnect().remove(function(error) {
            console.log(error);
        });

    } else {
        // User is signed out.
    }
});

// Update user coordinates as they progress
// Should I set up a setInterval funciton that updates every so often?
function updateCoordinates(userId, lng, lat) {
    firebase.database().ref('users/' + userId).update({
        lng: lng,
        lat: lat
    });
}

// Retrieve data as users progress
// What does data look like? Is it like { user: { lng: lng, lat: lat}}?
firebase.database().ref('users/').on('child_added', function(data) {
    var userId = data.key;
    var lng = data.val().lng;
    var lat = data.val().lat;
    console.log('child_added')

    // call calculateAndDisplayRoute()
    // console.log(data.val());
});

// variables
var map;
var marker;
var dummyMarker;
var directionsService;
var directionsDisplay;

// Create a map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 40.7128, lng: -74.0059},
        zoom: 10
    });

    marker = new google.maps.Marker({
        map: map,
        title:"You are here!"
    });
    // marker.metadata = { id: 'start' };

    dummyMarker = new google.maps.Marker({
        position: {lat: 40.8128, lng: -74.0059},
        map: map,
        title:"You are here!"
    });
    // dummyMarker.metadata = { id: 'end' };

    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map);
}

function getLocation() {
    // Get my location, please
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(handleLocationSuccess, function() {
            handleLocationError(true, marker, map.getCenter());
        });
    } else {
        handleLocationError(false, marker, map.getCenter);
    }
};

// Geolocation success/error handling
function handleLocationSuccess(position) {
    var coords = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    map.setCenter(coords);
    marker.setPosition(coords);
}

function handleLocationError(browserHasGeolocation, marker, pos) {
    marker.setPosition(pos);
    marker.setContent(browserHasGeolocation ?
            'Error: The Geolocation service failed.' :
            'Error: Your browser doesn\'t support geolocation.');
}

// Google directions
function getDirections() {

    var onChangeHandler = function() {
        calculateAndDisplayRoute(directionsService, directionsDisplay);
    };

    // Can I listen for a marker that I set through the script tag???
    // 'start' = user1; 'end' = user2;
    // Would it be better to just store the coordinates in a database and then get directions via the database rather than the markers on the map?
    document.getElementById('start').addEventListener('change', onChangeHandler);
    document.getElementById('end').addEventListener('change', onChangeHandler);
};

function calculateAndDisplayRoute(directionsService, directionsDisplay) {

    directionsService.route({
            origin: document.getElementById('start').value, // user1 coordinates
            destination: document.getElementById('end').value, // user2 coordinates
            travelMode: 'DRIVING'
        },

        function(response, status) {
            if (status === 'OK') {
                directionsDisplay.setDirections(response);
            } else {
                window.alert('Directions request failed due to ' + status);
            }
    });
};
