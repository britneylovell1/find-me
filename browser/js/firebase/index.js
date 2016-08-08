// variables
var map;
var directionsService;
var directionsDisplay;

// Google's callback initializes map when document is ready, which then calls getUser()
function startApp() {
    var userId;

    // Sign in user and initiate in firebase
    welcomeUser();

    // Get current user
    userId = firebase.auth().currentUser.uid;

    // Create a marker for that user
    var marker = new google.maps.Marker({
        map: map
    });

    // Get user consent + find current location
    prettyPlease().then(function(permission) {

            if (permission) {
                getLocation(userId, marker);
            }

        })

    // Remove users once disconnected
    firebase.database().ref('users/' + userId).onDisconnect().remove(function(error) {
        console.log(error);
    });


}

// Change Handler
firebase.database().ref('users/').on('child_changed', function() {
    calculateAndDisplayRoute(directionsService, directionsDisplay);
});

function prettyPlease() {
    // Get user consent + find current location
    return Notification.requestPermission()
    .then(function(response) {

        if (response === 'denied') {
            alert('Please, oh please, give us permission to access your location.');
        }

        return true;

    })
    .catch(function(error) {
        console.log(error);
    });
}
