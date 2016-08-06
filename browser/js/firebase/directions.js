// Google directions

// Update directions everytime a user's location changes

function calculateAndDisplayRoute(directionsService, directionsDisplay) {
    // console.log('in calculateAndDisplayRoute');

    var marco;
    var polo;

    // Grab marco and polo from firebase
    firebase.database().ref('users/').limitToFirst(2).once('value', function(snapshot) {

        var userArray = [];
        snapshot.forEach(function(user) {
            userArray.push(user.val());
        });

        // marco = new google.maps.LatLng(userArray[0].lat, userArray[0].lng);
        // polo = new google.maps.LatLng(userArray[1].lat, userArray[1].lng);

        marco = userArray[0].address;
        polo = userArray[1].address;

    });



    // How do I access the coordinates for each user here?
    directionsService.route({
            origin: marco,
            destination: polo,
            travelMode: 'WALKING'
        },

        function(response, status) {
            if (status === 'OK') {
                directionsDisplay.setDirections(response);
            } else {
                window.alert('Directions request failed due to ' + status);
            }
    });
};
