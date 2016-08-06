// Google Geolocation

function getLocation(user, marker) {

    // Get my current location, please
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {

            youFoundMe(user, position);

        }, function() {

            handleLocationError(true, map.getCenter());

        });
    } else {

        handleLocationError(false, map.getCenter());

    }
};

// Geolocation success/error handlers
function youFoundMe(user, position) {

    // Convert current location to coordinates
    var coords = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

    // Check if coords are a Google-approved address
    geocoder.geocode({'latLng': coords}, function(results, status) {

    if (status == google.maps.GeocoderStatus.OK) {

      // If the geolocation was recognized and an address was found
      if (results[0]) {

        // Compose a string with the address parts
        var address = results[0].address_components[1].long_name+' '+results[0].address_components[0].long_name+', '+results[0].address_components[3].long_name

        // Update user's address in firebase
        firebase.database().ref('users/' + user).update({
            address: address
        });

      }
    } else {

      // if the address couldn't be determined, alert and error with the status message
      alert("Geocoder failed due to: " + status);

    }

  });

}

function handleLocationError(browserHasGeolocation, pos) {

    // Set marker on default position on map
    var marker = new google.maps.Marker({
            position: pos,
            map: map,
            content: browserHasGeolocation ?
                'Error: The Geolocation service failed.' :
                'Error: Your browser doesn\'t support geolocation.'
          });

    // marker.setContent(browserHasGeolocation ?
    //         'Error: The Geolocation service failed.' :
    //         'Error: Your browser doesn\'t support geolocation.');
}
