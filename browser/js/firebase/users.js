// Create a new user in firebase

function welcomeUser() {

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in.
            var userId = user.uid;

            // Assign new user a default address
            firebase.database().ref('users/' + userId).set({
                // address: '5 Hanover Sq., New York, NY 10004'
                coordinates: {lat: 0, lng: 0}
            });

        } else {
            // User is signed out.
            firebase.auth().signInAnonymously()
            .catch(function(error) {

                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                alert(errorCode, '\nUh-oh!\nSomething went wrong! ', errorMessage)

            });
        }
    });

}


