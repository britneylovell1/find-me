// Google Geolocation

function getCurrentLocation() {
    // Get my current location, please
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {

            youFoundMe(user, marker, position);

        }, function() {

            handleLocationError(true, marker, map.getCenter());

        });
    } else {

        handleLocationError(false, marker, map.getCenter());

    }
}

function getLocation(user, marker) {
    // var marker = new google.maps.Marker({
    //     map: map
    // });

    // Get my current location, please
    // if (navigator.geolocation) {
    //     navigator.geolocation.getCurrentPosition(function(position) {

    //         youFoundMe(user, marker, position);

    //     }, function() {

    //         handleLocationError(true, marker, map.getCenter());

    //     });
    // } else {

    //     handleLocationError(false, marker, map.getCenter());

    // }

    console.log('in get location')

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(function(position) {

            youFoundMe(user, marker, position);

        }, function() {

            handleLocationError(true, marker, map.getCenter());

        });
    } else {

        handleLocationError(false, marker, map.getCenter());

    }
};

// Geolocation success/error handlers
function youFoundMe(user, marker, position) {
    // console.log('user ', user)

    var pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };

    // Set marker on map
    // marker.setPosition(pos);
    // map.setCenter(pos);


    // Update user's address in firebase
    firebase.database().ref('users/' + user).update({
        coordinates: pos
    });
}

function handleLocationError(browserHasGeolocation, marker, pos) {

    // Set marker on default position on map
    // var marker = new google.maps.Marker({
    //         position: pos,
    //         map: map,
    //         content: browserHasGeolocation ?
    //             'Error: The Geolocation service failed.' :
    //             'Error: Your browser doesn\'t support geolocation.'
    //       });

    marker.setPosition(pos);
    // marker.setContent(browserHasGeolocation ?
    //         'Error: The Geolocation service failed.' :
    //         'Error: Your browser doesn\'t support geolocation.');
}
