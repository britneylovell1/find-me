app.controller('MapCtrl', function($scope, MapFactory, NgMap) {
    $scope.sent = false;
    $scope.locationLink = 'localhost:1337';

    $scope.googleMapsUrl="https://maps.googleapis.com/maps/api/js?key=AIzaSyDuPZ9vV76biNnQaD1sMsjPxoHssKo2iHc";

    NgMap.getMap("map").then(function(map) {
        $scope.map = map;
    })
    .catch(function(error) {
        console.log(error);
    });

    $scope.map.center = {lat: 40.7128, lng: -74.0059};




    // // Change Handler
    // firebase.database().ref('users/').on('child_changed', function() {
    //     calculateAndDisplayRoute(directionsService, directionsDisplay);
    // });

});
