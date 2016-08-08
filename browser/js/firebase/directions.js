// Google directions

function calculateAndDisplayRoute(directionsService, directionsDisplay) {

    var marco;
    var polo;

    // Grab marco and polo from firebase
    firebase.database().ref('users/').limitToFirst(2).once('value', function(snapshot) {

        var userArray = [];
        snapshot.forEach(function(user) {
            userArray.push(user.val());
        });

        if (userArray.length === 1) {
            return;
        }

        marco = userArray[0].coordinates;
        polo = userArray[1].coordinates;

    });

    // Don't get directions if there isn't a second person
    if (!polo) {
        return;
    }
    console.log('calculating')

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
