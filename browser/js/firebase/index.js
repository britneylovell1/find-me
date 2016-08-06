// firebase.auth().currentUser()

// Update user coordinates as they progress
// Should I set up a setInterval function that updates every so often?
// Where do I put the reoccuring updateCoordinates() function?
function updateCoordinates(userId, lng, lat) {
    console.log('in update');
    // getLocation();
    firebase.database().ref('users/' + userId).update({
        lat: lat,
        lng: lng
    });
}

// // Do I need this function?
// firebase.database().ref('users/').on('child_added', function(user) {

//     firebase.database().ref('users/').
//     if(!user.name) {
//         firebase.database().ref('users/' + user.key).set({
//                 name: 'marco',
//                 lat: 0,
//                 lng: 0
//             });
//     } else if (user.name === 'marco') {
//         firebase.database().ref('users/' + user.key).set({
//                 name: 'polo',
//                 lat: 0,
//                 lng: 0
//             });
//     }
//     // Initialize directions
//     // Be sure to send coordinates for this
//     // getDirections();
// });

// // Retrieve data as user locations are updated
// // This is now onChangeHandler()
firebase.database().ref('users/').on('child_changed', function() {
    calculateAndDisplayRoute(directionsService, directionsDisplay);
});

// How do I send separate information to getDirections()? Maybe send token instead of coordinates?
