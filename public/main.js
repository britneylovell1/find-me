'use strict';

window.app = angular.module('FullstackGeneratedApp', ['fsaPreBuilt', 'ui.router', 'ui.bootstrap', 'ngAnimate', 'ngMap']);

app.config(function ($urlRouterProvider, $locationProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
    // Trigger page refresh when accessing an OAuth route
    $urlRouterProvider.when('/auth/:provider', function () {
        window.location.reload();
    });
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {

    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
        return state.data && state.data.authenticate;
    };

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {

        if (!destinationStateRequiresAuth(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function (user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            if (user) {
                $state.go(toState.name, toParams);
            } else {
                $state.go('login');
            }
        });
    });
});

// Google directions

function calculateAndDisplayRoute(directionsService, directionsDisplay) {

    var marco;
    var polo;

    // Grab marco and polo from firebase
    firebase.database().ref('users/').limitToFirst(2).once('value', function (snapshot) {

        var userArray = [];
        snapshot.forEach(function (user) {
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
    console.log('calculating');

    directionsService.route({
        origin: marco,
        destination: polo,
        travelMode: 'WALKING'
    }, function (response, status) {
        if (status === 'OK') {
            directionsDisplay.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
};

// Initialize Firebase
var config = {
    apiKey: "AIzaSyAFYUbp7_QhaiMIQN3Iwk54dXMxQJ8kM_o",
    authDomain: "gh-find-me.firebaseapp.com",
    databaseURL: "https://gh-find-me.firebaseio.com",
    storageBucket: "gh-find-me.appspot.com"
};

firebase.initializeApp(config);

// Google Geolocation

function getCurrentLocation() {
    // Get my current location, please
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {

            youFoundMe(user, marker, position);
        }, function () {

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

    console.log('in get location');

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(function (position) {

            youFoundMe(user, marker, position);
        }, function () {

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
    prettyPlease().then(function (permission) {

        if (permission) {
            getLocation(userId, marker);
        }
    });

    // Remove users once disconnected
    firebase.database().ref('users/' + userId).onDisconnect().remove(function (error) {
        console.log(error);
    });
}

// Change Handler
firebase.database().ref('users/').on('child_changed', function () {
    calculateAndDisplayRoute(directionsService, directionsDisplay);
});

function prettyPlease() {
    // Get user consent + find current location
    return Notification.requestPermission().then(function (response) {

        if (response === 'denied') {
            alert('Please, oh please, give us permission to access your location.');
        }

        return true;
    }).catch(function (error) {
        console.log(error);
    });
}

// Create a map
// var map;
// var directionsService;
// var directionsDisplay;

// function initMap() {
//     map = new google.maps.Map(document.getElementById('map_canvas'), {
//         center: {lat: 40.7128, lng: -74.0059},
//         zoom: 10
//     });

//     directionsService = new google.maps.DirectionsService;
//     directionsDisplay = new google.maps.DirectionsRenderer;
//     directionsDisplay.setMap(map);

//     // Trigger firebase sign-in
//     google.maps.event.addListenerOnce(map, 'tilesloaded', function(){
//         startApp();
//     });
// }

// Create a new user in firebase

function welcomeUser() {

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            // User is signed in.
            var userId = user.uid;

            // Assign new user a default address
            firebase.database().ref('users/' + userId).set({
                // address: '5 Hanover Sq., New York, NY 10004'
                coordinates: { lat: 0, lng: 0 }
            });
        } else {
            // User is signed out.
            firebase.auth().signInAnonymously().catch(function (error) {

                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                alert(errorCode, '\nUh-oh!\nSomething went wrong! ', errorMessage);
            });
        }
    });
}

(function () {

    'use strict';

    // Hope you didn't forget Angular! Duh-doy.

    if (!window.angular) throw new Error('I can\'t find Angular!');

    var app = angular.module('fsaPreBuilt', []);

    app.factory('Socket', function () {
        if (!window.io) throw new Error('socket.io not found!');
        return window.io(window.location.origin);
    });

    // AUTH_EVENTS is used throughout our app to
    // broadcast and listen from and to the $rootScope
    // for important events about authentication flow.
    app.constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

    app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        var statusDict = {
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
        };
        return {
            responseError: function responseError(response) {
                $rootScope.$broadcast(statusDict[response.status], response);
                return $q.reject(response);
            }
        };
    });

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push(['$injector', function ($injector) {
            return $injector.get('AuthInterceptor');
        }]);
    });

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q) {

        function onSuccessfulLogin(response) {
            var data = response.data;
            Session.create(data.id, data.user);
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            return data.user;
        }

        // Uses the session factory to see if an
        // authenticated user is currently registered.
        this.isAuthenticated = function () {
            return !!Session.user;
        };

        this.getLoggedInUser = function (fromServer) {

            // If an authenticated session exists, we
            // return the user attached to that session
            // with a promise. This ensures that we can
            // always interface with this method asynchronously.

            // Optionally, if true is given as the fromServer parameter,
            // then this cached value will not be used.

            if (this.isAuthenticated() && fromServer !== true) {
                return $q.when(Session.user);
            }

            // Make request GET /session.
            // If it returns a user, call onSuccessfulLogin with the response.
            // If it returns a 401 response, we catch it and instead resolve to null.
            return $http.get('/session').then(onSuccessfulLogin).catch(function () {
                return null;
            });
        };

        this.login = function (credentials) {
            return $http.post('/login', credentials).then(onSuccessfulLogin).catch(function () {
                return $q.reject({ message: 'Invalid login credentials.' });
            });
        };

        this.logout = function () {
            return $http.get('/logout').then(function () {
                Session.destroy();
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            });
        };
    });

    app.service('Session', function ($rootScope, AUTH_EVENTS) {

        var self = this;

        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            self.destroy();
        });

        $rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
            self.destroy();
        });

        this.id = null;
        this.user = null;

        this.create = function (sessionId, user) {
            this.id = sessionId;
            this.user = user;
        };

        this.destroy = function () {
            this.id = null;
            this.user = null;
        };
    });
})();

app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html'
    });
});

app.controller('MapCtrl', function ($scope, MapFactory, NgMap) {
    $scope.sent = false;
    $scope.locationLink = 'localhost:1337';

    $scope.googleMapsUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDuPZ9vV76biNnQaD1sMsjPxoHssKo2iHc";

    NgMap.getMap("map").then(function (map) {
        $scope.map = map;
    }).catch(function (error) {
        console.log(error);
    });

    $scope.map.center = { lat: 40.7128, lng: -74.0059 };

    // // Change Handler
    // firebase.database().ref('users/').on('child_changed', function() {
    //     calculateAndDisplayRoute(directionsService, directionsDisplay);
    // });
});

app.factory('MapFactory', function () {
    return {
        welcomeUser: function welcomeUser() {

            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    // User is signed in.
                    var userId = user.uid;

                    // Assign new user a default address
                    firebase.database().ref('users/' + userId).set({
                        // address: '5 Hanover Sq., New York, NY 10004'
                        coordinates: { lat: 0, lng: 0 }
                    });
                } else {
                    // User is signed out.
                    firebase.auth().signInAnonymously().catch(function (error) {

                        // Handle Errors here.
                        var errorCode = error.code;
                        var errorMessage = error.message;
                        alert(errorCode, '\nUh-oh!\nSomething went wrong! ', errorMessage);
                    });
                }
            });
        },
        prettyPlease: function prettyPlease() {

            // Get user consent + find current location
            return Notification.requestPermission().then(function (response) {

                if (response === 'denied') {
                    alert('Please, oh please, give us permission to access your location.');
                }

                return true;
            }).catch(function (error) {
                console.log(error);
            });
        }
    };
});

app.config(function ($stateProvider) {
    $stateProvider.state('map', {
        url: '/map',
        templateUrl: 'js/map/map.html'
    });
});
// .config(function(uiGmapGoogleMapApiProvider) {
//     uiGmapGoogleMapApiProvider.configure({
//         key: 'AIzaSyDuPZ9vV76biNnQaD1sMsjPxoHssKo2iHc',
//         v: '3.2.3', //defaults to latest 3.X anyhow
//         libraries: 'weather,geometry,visualization'
//     });
// })


app.factory('FullstackPics', function () {
    return ['https://pbs.twimg.com/media/B7gBXulCAAAXQcE.jpg:large', 'https://fbcdn-sphotos-c-a.akamaihd.net/hphotos-ak-xap1/t31.0-8/10862451_10205622990359241_8027168843312841137_o.jpg', 'https://pbs.twimg.com/media/B-LKUshIgAEy9SK.jpg', 'https://pbs.twimg.com/media/B79-X7oCMAAkw7y.jpg', 'https://pbs.twimg.com/media/B-Uj9COIIAIFAh0.jpg:large', 'https://pbs.twimg.com/media/B6yIyFiCEAAql12.jpg:large', 'https://pbs.twimg.com/media/CE-T75lWAAAmqqJ.jpg:large', 'https://pbs.twimg.com/media/CEvZAg-VAAAk932.jpg:large', 'https://pbs.twimg.com/media/CEgNMeOXIAIfDhK.jpg:large', 'https://pbs.twimg.com/media/CEQyIDNWgAAu60B.jpg:large', 'https://pbs.twimg.com/media/CCF3T5QW8AE2lGJ.jpg:large', 'https://pbs.twimg.com/media/CAeVw5SWoAAALsj.jpg:large', 'https://pbs.twimg.com/media/CAaJIP7UkAAlIGs.jpg:large', 'https://pbs.twimg.com/media/CAQOw9lWEAAY9Fl.jpg:large', 'https://pbs.twimg.com/media/B-OQbVrCMAANwIM.jpg:large', 'https://pbs.twimg.com/media/B9b_erwCYAAwRcJ.png:large', 'https://pbs.twimg.com/media/B5PTdvnCcAEAl4x.jpg:large', 'https://pbs.twimg.com/media/B4qwC0iCYAAlPGh.jpg:large', 'https://pbs.twimg.com/media/B2b33vRIUAA9o1D.jpg:large', 'https://pbs.twimg.com/media/BwpIwr1IUAAvO2_.jpg:large', 'https://pbs.twimg.com/media/BsSseANCYAEOhLw.jpg:large', 'https://pbs.twimg.com/media/CJ4vLfuUwAAda4L.jpg:large', 'https://pbs.twimg.com/media/CI7wzjEVEAAOPpS.jpg:large', 'https://pbs.twimg.com/media/CIdHvT2UsAAnnHV.jpg:large', 'https://pbs.twimg.com/media/CGCiP_YWYAAo75V.jpg:large', 'https://pbs.twimg.com/media/CIS4JPIWIAI37qu.jpg:large'];
});

app.factory('RandomGreetings', function () {

    var getRandomFromArray = function getRandomFromArray(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    };

    var greetings = ['Hello, world!', 'At long last, I live!', 'Hello, simple human.', 'What a beautiful day!', 'I\'m like any other project, except that I am yours. :)', 'This empty string is for Lindsay Levine.', 'こんにちは、ユーザー様。', 'Welcome. To. WEBSITE.', ':D', 'Yes, I think we\'ve met before.', 'Gimme 3 mins... I just grabbed this really dope frittata', 'If Cooper could offer only one piece of advice, it would be to nevSQUIRREL!'];

    return {
        greetings: greetings,
        getRandomGreeting: function getRandomGreeting() {
            return getRandomFromArray(greetings);
        }
    };
});

app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/fullstack-logo.html'
    };
});
app.directive('navbar', function ($rootScope, $state) {

    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/navbar/navbar.html',
        controller: 'MapCtrl'
    };
});

app.directive('randoGreeting', function (RandomGreetings) {

    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/rando-greeting/rando-greeting.html',
        link: function link(scope) {
            scope.greeting = RandomGreetings.getRandomGreeting();
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZpcmViYXNlL2RpcmVjdGlvbnMuanMiLCJmaXJlYmFzZS9maXJlYmFzZS5qcyIsImZpcmViYXNlL2dlb2xvY2F0aW9uLmpzIiwiZmlyZWJhc2UvaW5kZXguanMiLCJmaXJlYmFzZS9tYXAuanMiLCJmaXJlYmFzZS91c2Vycy5qcyIsImZzYS9mc2EtcHJlLWJ1aWx0LmpzIiwiaG9tZS9ob21lLmpzIiwibWFwL2xvY2F0ZS5jb250cm9sbGVyLmpzIiwibWFwL21hcC5mYWN0b3J5LmpzIiwibWFwL21hcC5zdGF0ZS5qcyIsImNvbW1vbi9mYWN0b3JpZXMvRnVsbHN0YWNrUGljcy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUmFuZG9tR3JlZXRpbmdzLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FBQ0EsT0FBQSxHQUFBLEdBQUEsUUFBQSxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxPQUFBLENBQUEsQ0FBQTs7QUFFQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGtCQUFBLEVBQUEsaUJBQUEsRUFBQTtBQUNBO0FBQ0Esc0JBQUEsU0FBQSxDQUFBLElBQUE7QUFDQTtBQUNBLHVCQUFBLFNBQUEsQ0FBQSxHQUFBO0FBQ0E7QUFDQSx1QkFBQSxJQUFBLENBQUEsaUJBQUEsRUFBQSxZQUFBO0FBQ0EsZUFBQSxRQUFBLENBQUEsTUFBQTtBQUNBLEtBRkE7QUFHQSxDQVRBOztBQVdBO0FBQ0EsSUFBQSxHQUFBLENBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQTtBQUNBLFFBQUEsK0JBQUEsU0FBQSw0QkFBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLGVBQUEsTUFBQSxJQUFBLElBQUEsTUFBQSxJQUFBLENBQUEsWUFBQTtBQUNBLEtBRkE7O0FBSUE7QUFDQTtBQUNBLGVBQUEsR0FBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQTs7QUFFQSxZQUFBLENBQUEsNkJBQUEsT0FBQSxDQUFBLEVBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxZQUFBLFlBQUEsZUFBQSxFQUFBLEVBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGNBQUEsY0FBQTs7QUFFQSxvQkFBQSxlQUFBLEdBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQUEsSUFBQSxFQUFBO0FBQ0EsdUJBQUEsRUFBQSxDQUFBLFFBQUEsSUFBQSxFQUFBLFFBQUE7QUFDQSxhQUZBLE1BRUE7QUFDQSx1QkFBQSxFQUFBLENBQUEsT0FBQTtBQUNBO0FBQ0EsU0FUQTtBQVdBLEtBNUJBO0FBOEJBLENBdkNBOztBQ2ZBOztBQUVBLFNBQUEsd0JBQUEsQ0FBQSxpQkFBQSxFQUFBLGlCQUFBLEVBQUE7O0FBRUEsUUFBQSxLQUFBO0FBQ0EsUUFBQSxJQUFBOztBQUVBO0FBQ0EsYUFBQSxRQUFBLEdBQUEsR0FBQSxDQUFBLFFBQUEsRUFBQSxZQUFBLENBQUEsQ0FBQSxFQUFBLElBQUEsQ0FBQSxPQUFBLEVBQUEsVUFBQSxRQUFBLEVBQUE7O0FBRUEsWUFBQSxZQUFBLEVBQUE7QUFDQSxpQkFBQSxPQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxzQkFBQSxJQUFBLENBQUEsS0FBQSxHQUFBLEVBQUE7QUFDQSxTQUZBOztBQUlBLFlBQUEsVUFBQSxNQUFBLEtBQUEsQ0FBQSxFQUFBO0FBQ0E7QUFDQTs7QUFFQSxnQkFBQSxVQUFBLENBQUEsRUFBQSxXQUFBO0FBQ0EsZUFBQSxVQUFBLENBQUEsRUFBQSxXQUFBO0FBRUEsS0FkQTs7QUFn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LENBQUEsVUFBQSxhQUFBLEVBQUE7QUFDQSxzQkFBQSxZQUFBLENBQUEsSUFBQSxDQUFBLENBQ0EsV0FEQSxFQUVBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsbUJBQUEsVUFBQSxHQUFBLENBQUEsaUJBQUEsQ0FBQTtBQUNBLFNBSkEsQ0FBQTtBQU1BLEtBUEE7O0FBU0EsUUFBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLEVBQUEsRUFBQTs7QUFFQSxpQkFBQSxpQkFBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLGdCQUFBLE9BQUEsU0FBQSxJQUFBO0FBQ0Esb0JBQUEsTUFBQSxDQUFBLEtBQUEsRUFBQSxFQUFBLEtBQUEsSUFBQTtBQUNBLHVCQUFBLFVBQUEsQ0FBQSxZQUFBLFlBQUE7QUFDQSxtQkFBQSxLQUFBLElBQUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsYUFBQSxlQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsQ0FBQSxRQUFBLElBQUE7QUFDQSxTQUZBOztBQUlBLGFBQUEsZUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsZ0JBQUEsS0FBQSxlQUFBLE1BQUEsZUFBQSxJQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLElBQUEsQ0FBQSxRQUFBLElBQUEsQ0FBQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1CQUFBLE1BQUEsR0FBQSxDQUFBLFVBQUEsRUFBQSxJQUFBLENBQUEsaUJBQUEsRUFBQSxLQUFBLENBQUEsWUFBQTtBQUNBLHVCQUFBLElBQUE7QUFDQSxhQUZBLENBQUE7QUFJQSxTQXJCQTs7QUF1QkEsYUFBQSxLQUFBLEdBQUEsVUFBQSxXQUFBLEVBQUE7QUFDQSxtQkFBQSxNQUFBLElBQUEsQ0FBQSxRQUFBLEVBQUEsV0FBQSxFQUNBLElBREEsQ0FDQSxpQkFEQSxFQUVBLEtBRkEsQ0FFQSxZQUFBO0FBQ0EsdUJBQUEsR0FBQSxNQUFBLENBQUEs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TEEsRUFNQSwwQ0FOQSxFQU9BLGNBUEEsRUFRQSx1QkFSQSxFQVNBLElBVEEsRUFVQSxpQ0FWQSxFQVdBLDBEQVhBLEVBWUEsNkVBWkEsQ0FBQTs7QUFlQSxXQUFBO0FBQ0EsbUJBQUEsU0FEQTtBQUVBLDJCQUFBLDZCQUFBO0FBQ0EsbUJBQUEsbUJBQUEsU0FBQSxDQUFBO0FBQ0E7QUFKQSxLQUFBO0FBT0EsQ0E1QkE7O0FDQUEsSUFBQSxTQUFBLENBQUEsZUFBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0Esa0JBQUEsR0FEQTtBQUVBLHFCQUFBO0FBRkEsS0FBQTtBQUlBLENBTEE7QUNBQSxJQUFBLFNBQUEsQ0FBQSxRQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsTUFBQSxFQUFBOztBQUVBLFdBQUE7QUFDQSxrQkFBQSxHQURBO0FBRUEscUJBQUEseUNBRkE7QUFHQSxvQkFBQTtBQUhBLEtBQUE7QUFNQSxDQVJBOztBQ0FBLElBQUEsU0FBQSxDQUFBLGVBQUEsRUFBQSxVQUFBLGVBQUEsRUFBQTs7QUFFQSxXQUFBO0FBQ0Esa0JBQUEsR0FEQTtBQUVBLHFCQUFBLHlEQUZBO0FBR0EsY0FBQSxjQUFBLEtBQUEsRUFBQTtBQUNBLGtCQUFBLFFBQUEsR0FBQSxnQkFBQSxpQkFBQSxFQUFBO0FBQ0E7QUFMQSxLQUFBO0FBUUEsQ0FWQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJywgJ25nTWFwJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCIvLyBHb29nbGUgZGlyZWN0aW9uc1xuXG5mdW5jdGlvbiBjYWxjdWxhdGVBbmREaXNwbGF5Um91dGUoZGlyZWN0aW9uc1NlcnZpY2UsIGRpcmVjdGlvbnNEaXNwbGF5KSB7XG5cbiAgICB2YXIgbWFyY287XG4gICAgdmFyIHBvbG87XG5cbiAgICAvLyBHcmFiIG1hcmNvIGFuZCBwb2xvIGZyb20gZmlyZWJhc2VcbiAgICBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZigndXNlcnMvJykubGltaXRUb0ZpcnN0KDIpLm9uY2UoJ3ZhbHVlJywgZnVuY3Rpb24oc25hcHNob3QpIHtcblxuICAgICAgICB2YXIgdXNlckFycmF5ID0gW107XG4gICAgICAgIHNuYXBzaG90LmZvckVhY2goZnVuY3Rpb24odXNlcikge1xuICAgICAgICAgICAgdXNlckFycmF5LnB1c2godXNlci52YWwoKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh1c2VyQXJyYXkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBtYXJjbyA9IHVzZXJBcnJheVswXS5jb29yZGluYXRlcztcbiAgICAgICAgcG9sbyA9IHVzZXJBcnJheVsxXS5jb29yZGluYXRlcztcblxuICAgIH0pO1xuXG4gICAgLy8gRG9uJ3QgZ2V0IGRpcmVjdGlvbnMgaWYgdGhlcmUgaXNuJ3QgYSBzZWNvbmQgcGVyc29uXG4gICAgaWYgKCFwb2xvKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc29sZS5sb2coJ2NhbGN1bGF0aW5nJylcblxuICAgIGRpcmVjdGlvbnNTZXJ2aWNlLnJvdXRlKHtcbiAgICAgICAgICAgIG9yaWdpbjogbWFyY28sXG4gICAgICAgICAgICBkZXN0aW5hdGlvbjogcG9sbyxcbiAgICAgICAgICAgIHRyYXZlbE1vZGU6ICdXQUxLSU5HJ1xuICAgICAgICB9LFxuXG4gICAgICAgIGZ1bmN0aW9uKHJlc3BvbnNlLCBzdGF0dXMpIHtcbiAgICAgICAgICAgIGlmIChzdGF0dXMgPT09ICdPSycpIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb25zRGlzcGxheS5zZXREaXJlY3Rpb25zKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmFsZXJ0KCdEaXJlY3Rpb25zIHJlcXVlc3QgZmFpbGVkIGR1ZSB0byAnICsgc3RhdHVzKTtcbiAgICAgICAgICAgIH1cbiAgICB9KTtcbn07XG4iLCIvLyBJbml0aWFsaXplIEZpcmViYXNlXG52YXIgY29uZmlnID0ge1xuICAgIGFwaUtleTogXCJBSXphU3lBRllVYnA3X1FoYWlNSVFOM0l3azU0ZFhNeFFKOGtNX29cIixcbiAgICBhdXRoRG9tYWluOiBcImdoLWZpbmQtbWUuZmlyZWJhc2VhcHAuY29tXCIsXG4gICAgZGF0YWJhc2VVUkw6IFwiaHR0cHM6Ly9naC1maW5kLW1lLmZpcmViYXNlaW8uY29tXCIsXG4gICAgc3RvcmFnZUJ1Y2tldDogXCJnaC1maW5kLW1lLmFwcHNwb3QuY29tXCIsXG59O1xuXG5maXJlYmFzZS5pbml0aWFsaXplQXBwKGNvbmZpZyk7XG4iLCIvLyBHb29nbGUgR2VvbG9jYXRpb25cblxuZnVuY3Rpb24gZ2V0Q3VycmVudExvY2F0aW9uKCkge1xuICAgIC8vIEdldCBteSBjdXJyZW50IGxvY2F0aW9uLCBwbGVhc2VcbiAgICBpZiAobmF2aWdhdG9yLmdlb2xvY2F0aW9uKSB7XG4gICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24oZnVuY3Rpb24ocG9zaXRpb24pIHtcblxuICAgICAgICAgICAgeW91Rm91bmRNZSh1c2VyLCBtYXJrZXIsIHBvc2l0aW9uKTtcblxuICAgICAgICB9LCBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgaGFuZGxlTG9jYXRpb25FcnJvcih0cnVlLCBtYXJrZXIsIG1hcC5nZXRDZW50ZXIoKSk7XG5cbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcblxuICAgICAgICBoYW5kbGVMb2NhdGlvbkVycm9yKGZhbHNlLCBtYXJrZXIsIG1hcC5nZXRDZW50ZXIoKSk7XG5cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldExvY2F0aW9uKHVzZXIsIG1hcmtlcikge1xuICAgIC8vIHZhciBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcbiAgICAvLyAgICAgbWFwOiBtYXBcbiAgICAvLyB9KTtcblxuICAgIC8vIEdldCBteSBjdXJyZW50IGxvY2F0aW9uLCBwbGVhc2VcbiAgICAvLyBpZiAobmF2aWdhdG9yLmdlb2xvY2F0aW9uKSB7XG4gICAgLy8gICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24oZnVuY3Rpb24ocG9zaXRpb24pIHtcblxuICAgIC8vICAgICAgICAgeW91Rm91bmRNZSh1c2VyLCBtYXJrZXIsIHBvc2l0aW9uKTtcblxuICAgIC8vICAgICB9LCBmdW5jdGlvbigpIHtcblxuICAgIC8vICAgICAgICAgaGFuZGxlTG9jYXRpb25FcnJvcih0cnVlLCBtYXJrZXIsIG1hcC5nZXRDZW50ZXIoKSk7XG5cbiAgICAvLyAgICAgfSk7XG4gICAgLy8gfSBlbHNlIHtcblxuICAgIC8vICAgICBoYW5kbGVMb2NhdGlvbkVycm9yKGZhbHNlLCBtYXJrZXIsIG1hcC5nZXRDZW50ZXIoKSk7XG5cbiAgICAvLyB9XG5cbiAgICBjb25zb2xlLmxvZygnaW4gZ2V0IGxvY2F0aW9uJylcblxuICAgIGlmIChuYXZpZ2F0b3IuZ2VvbG9jYXRpb24pIHtcbiAgICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLndhdGNoUG9zaXRpb24oZnVuY3Rpb24ocG9zaXRpb24pIHtcblxuICAgICAgICAgICAgeW91Rm91bmRNZSh1c2VyLCBtYXJrZXIsIHBvc2l0aW9uKTtcblxuICAgICAgICB9LCBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgaGFuZGxlTG9jYXRpb25FcnJvcih0cnVlLCBtYXJrZXIsIG1hcC5nZXRDZW50ZXIoKSk7XG5cbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcblxuICAgICAgICBoYW5kbGVMb2NhdGlvbkVycm9yKGZhbHNlLCBtYXJrZXIsIG1hcC5nZXRDZW50ZXIoKSk7XG5cbiAgICB9XG59O1xuXG4vLyBHZW9sb2NhdGlvbiBzdWNjZXNzL2Vycm9yIGhhbmRsZXJzXG5mdW5jdGlvbiB5b3VGb3VuZE1lKHVzZXIsIG1hcmtlciwgcG9zaXRpb24pIHtcbiAgICAvLyBjb25zb2xlLmxvZygndXNlciAnLCB1c2VyKVxuXG4gICAgdmFyIHBvcyA9IHtcbiAgICAgICAgICAgICAgbGF0OiBwb3NpdGlvbi5jb29yZHMubGF0aXR1ZGUsXG4gICAgICAgICAgICAgIGxuZzogcG9zaXRpb24uY29vcmRzLmxvbmdpdHVkZVxuICAgICAgICAgICAgfTtcblxuICAgIC8vIFNldCBtYXJrZXIgb24gbWFwXG4gICAgLy8gbWFya2VyLnNldFBvc2l0aW9uKHBvcyk7XG4gICAgLy8gbWFwLnNldENlbnRlcihwb3MpO1xuXG5cbiAgICAvLyBVcGRhdGUgdXNlcidzIGFkZHJlc3MgaW4gZmlyZWJhc2VcbiAgICBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZigndXNlcnMvJyArIHVzZXIpLnVwZGF0ZSh7XG4gICAgICAgIGNvb3JkaW5hdGVzOiBwb3NcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlTG9jYXRpb25FcnJvcihicm93c2VySGFzR2VvbG9jYXRpb24sIG1hcmtlciwgcG9zKSB7XG5cbiAgICAvLyBTZXQgbWFya2VyIG9uIGRlZmF1bHQgcG9zaXRpb24gb24gbWFwXG4gICAgLy8gdmFyIG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgIC8vICAgICAgICAgcG9zaXRpb246IHBvcyxcbiAgICAvLyAgICAgICAgIG1hcDogbWFwLFxuICAgIC8vICAgICAgICAgY29udGVudDogYnJvd3Nlckhhc0dlb2xvY2F0aW9uID9cbiAgICAvLyAgICAgICAgICAgICAnRXJyb3I6IFRoZSBHZW9sb2NhdGlvbiBzZXJ2aWNlIGZhaWxlZC4nIDpcbiAgICAvLyAgICAgICAgICAgICAnRXJyb3I6IFlvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCBnZW9sb2NhdGlvbi4nXG4gICAgLy8gICAgICAgfSk7XG5cbiAgICBtYXJrZXIuc2V0UG9zaXRpb24ocG9zKTtcbiAgICAvLyBtYXJrZXIuc2V0Q29udGVudChicm93c2VySGFzR2VvbG9jYXRpb24gP1xuICAgIC8vICAgICAgICAgJ0Vycm9yOiBUaGUgR2VvbG9jYXRpb24gc2VydmljZSBmYWlsZWQuJyA6XG4gICAgLy8gICAgICAgICAnRXJyb3I6IFlvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCBnZW9sb2NhdGlvbi4nKTtcbn1cbiIsIi8vIHZhcmlhYmxlc1xudmFyIG1hcDtcbnZhciBkaXJlY3Rpb25zU2VydmljZTtcbnZhciBkaXJlY3Rpb25zRGlzcGxheTtcblxuLy8gR29vZ2xlJ3MgY2FsbGJhY2sgaW5pdGlhbGl6ZXMgbWFwIHdoZW4gZG9jdW1lbnQgaXMgcmVhZHksIHdoaWNoIHRoZW4gY2FsbHMgZ2V0VXNlcigpXG5mdW5jdGlvbiBzdGFydEFwcCgpIHtcbiAgICB2YXIgdXNlcklkO1xuXG4gICAgLy8gU2lnbiBpbiB1c2VyIGFuZCBpbml0aWF0ZSBpbiBmaXJlYmFzZVxuICAgIHdlbGNvbWVVc2VyKCk7XG5cbiAgICAvLyBHZXQgY3VycmVudCB1c2VyXG4gICAgdXNlcklkID0gZmlyZWJhc2UuYXV0aCgpLmN1cnJlbnRVc2VyLnVpZDtcblxuICAgIC8vIENyZWF0ZSBhIG1hcmtlciBmb3IgdGhhdCB1c2VyXG4gICAgdmFyIG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICBtYXA6IG1hcFxuICAgIH0pO1xuXG4gICAgLy8gR2V0IHVzZXIgY29uc2VudCArIGZpbmQgY3VycmVudCBsb2NhdGlvblxuICAgIHByZXR0eVBsZWFzZSgpLnRoZW4oZnVuY3Rpb24ocGVybWlzc2lvbikge1xuXG4gICAgICAgICAgICBpZiAocGVybWlzc2lvbikge1xuICAgICAgICAgICAgICAgIGdldExvY2F0aW9uKHVzZXJJZCwgbWFya2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KVxuXG4gICAgLy8gUmVtb3ZlIHVzZXJzIG9uY2UgZGlzY29ubmVjdGVkXG4gICAgZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoJ3VzZXJzLycgKyB1c2VySWQpLm9uRGlzY29ubmVjdCgpLnJlbW92ZShmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgfSk7XG5cblxufVxuXG4vLyBDaGFuZ2UgSGFuZGxlclxuZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoJ3VzZXJzLycpLm9uKCdjaGlsZF9jaGFuZ2VkJywgZnVuY3Rpb24oKSB7XG4gICAgY2FsY3VsYXRlQW5kRGlzcGxheVJvdXRlKGRpcmVjdGlvbnNTZXJ2aWNlLCBkaXJlY3Rpb25zRGlzcGxheSk7XG59KTtcblxuZnVuY3Rpb24gcHJldHR5UGxlYXNlKCkge1xuICAgIC8vIEdldCB1c2VyIGNvbnNlbnQgKyBmaW5kIGN1cnJlbnQgbG9jYXRpb25cbiAgICByZXR1cm4gTm90aWZpY2F0aW9uLnJlcXVlc3RQZXJtaXNzaW9uKClcbiAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXG4gICAgICAgIGlmIChyZXNwb25zZSA9PT0gJ2RlbmllZCcpIHtcbiAgICAgICAgICAgIGFsZXJ0KCdQbGVhc2UsIG9oIHBsZWFzZSwgZ2l2ZSB1cyBwZXJtaXNzaW9uIHRvIGFjY2VzcyB5b3VyIGxvY2F0aW9uLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICB9KVxuICAgIC5jYXRjaChmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgfSk7XG59XG4iLCIvLyBDcmVhdGUgYSBtYXBcbi8vIHZhciBtYXA7XG4vLyB2YXIgZGlyZWN0aW9uc1NlcnZpY2U7XG4vLyB2YXIgZGlyZWN0aW9uc0Rpc3BsYXk7XG5cbi8vIGZ1bmN0aW9uIGluaXRNYXAoKSB7XG4vLyAgICAgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwX2NhbnZhcycpLCB7XG4vLyAgICAgICAgIGNlbnRlcjoge2xhdDogNDAuNzEyOCwgbG5nOiAtNzQuMDA1OX0sXG4vLyAgICAgICAgIHpvb206IDEwXG4vLyAgICAgfSk7XG5cbi8vICAgICBkaXJlY3Rpb25zU2VydmljZSA9IG5ldyBnb29nbGUubWFwcy5EaXJlY3Rpb25zU2VydmljZTtcbi8vICAgICBkaXJlY3Rpb25zRGlzcGxheSA9IG5ldyBnb29nbGUubWFwcy5EaXJlY3Rpb25zUmVuZGVyZXI7XG4vLyAgICAgZGlyZWN0aW9uc0Rpc3BsYXkuc2V0TWFwKG1hcCk7XG5cbi8vICAgICAvLyBUcmlnZ2VyIGZpcmViYXNlIHNpZ24taW5cbi8vICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lck9uY2UobWFwLCAndGlsZXNsb2FkZWQnLCBmdW5jdGlvbigpe1xuLy8gICAgICAgICBzdGFydEFwcCgpO1xuLy8gICAgIH0pO1xuLy8gfVxuIiwiLy8gQ3JlYXRlIGEgbmV3IHVzZXIgaW4gZmlyZWJhc2VcblxuZnVuY3Rpb24gd2VsY29tZVVzZXIoKSB7XG5cbiAgICBmaXJlYmFzZS5hdXRoKCkub25BdXRoU3RhdGVDaGFuZ2VkKGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIFVzZXIgaXMgc2lnbmVkIGluLlxuICAgICAgICAgICAgdmFyIHVzZXJJZCA9IHVzZXIudWlkO1xuXG4gICAgICAgICAgICAvLyBBc3NpZ24gbmV3IHVzZXIgYSBkZWZhdWx0IGFkZHJlc3NcbiAgICAgICAgICAgIGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKCd1c2Vycy8nICsgdXNlcklkKS5zZXQoe1xuICAgICAgICAgICAgICAgIC8vIGFkZHJlc3M6ICc1IEhhbm92ZXIgU3EuLCBOZXcgWW9yaywgTlkgMTAwMDQnXG4gICAgICAgICAgICAgICAgY29vcmRpbmF0ZXM6IHtsYXQ6IDAsIGxuZzogMH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBVc2VyIGlzIHNpZ25lZCBvdXQuXG4gICAgICAgICAgICBmaXJlYmFzZS5hdXRoKCkuc2lnbkluQW5vbnltb3VzbHkoKVxuICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycm9yKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBIYW5kbGUgRXJyb3JzIGhlcmUuXG4gICAgICAgICAgICAgICAgdmFyIGVycm9yQ29kZSA9IGVycm9yLmNvZGU7XG4gICAgICAgICAgICAgICAgdmFyIGVycm9yTWVzc2FnZSA9IGVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgYWxlcnQoZXJyb3JDb2RlLCAnXFxuVWgtb2ghXFxuU29tZXRoaW5nIHdlbnQgd3JvbmchICcsIGVycm9yTWVzc2FnZSlcblxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxufVxuXG5cbiIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvaG9tZS9ob21lLmh0bWwnXG4gICAgfSk7XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdNYXBDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBNYXBGYWN0b3J5LCBOZ01hcCkge1xuICAgICRzY29wZS5zZW50ID0gZmFsc2U7XG4gICAgJHNjb3BlLmxvY2F0aW9uTGluayA9ICdsb2NhbGhvc3Q6MTMzNyc7XG5cbiAgICAkc2NvcGUuZ29vZ2xlTWFwc1VybD1cImh0dHBzOi8vbWFwcy5nb29nbGVhcGlzLmNvbS9tYXBzL2FwaS9qcz9rZXk9QUl6YVN5RHVQWjl2Vjc2YmlOblFhRDFzTXNqUHhvSHNzS28yaUhjXCI7XG5cbiAgICBOZ01hcC5nZXRNYXAoXCJtYXBcIikudGhlbihmdW5jdGlvbihtYXApIHtcbiAgICAgICAgJHNjb3BlLm1hcCA9IG1hcDtcbiAgICB9KVxuICAgIC5jYXRjaChmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgfSk7XG5cbiAgICAkc2NvcGUubWFwLmNlbnRlciA9IHtsYXQ6IDQwLjcxMjgsIGxuZzogLTc0LjAwNTl9O1xuXG5cblxuXG4gICAgLy8gLy8gQ2hhbmdlIEhhbmRsZXJcbiAgICAvLyBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZigndXNlcnMvJykub24oJ2NoaWxkX2NoYW5nZWQnLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgY2FsY3VsYXRlQW5kRGlzcGxheVJvdXRlKGRpcmVjdGlvbnNTZXJ2aWNlLCBkaXJlY3Rpb25zRGlzcGxheSk7XG4gICAgLy8gfSk7XG5cbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ01hcEZhY3RvcnknLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB3ZWxjb21lVXNlcjogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICBmaXJlYmFzZS5hdXRoKCkub25BdXRoU3RhdGVDaGFuZ2VkKGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBVc2VyIGlzIHNpZ25lZCBpbi5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHVzZXJJZCA9IHVzZXIudWlkO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEFzc2lnbiBuZXcgdXNlciBhIGRlZmF1bHQgYWRkcmVzc1xuICAgICAgICAgICAgICAgICAgICBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZigndXNlcnMvJyArIHVzZXJJZCkuc2V0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFkZHJlc3M6ICc1IEhhbm92ZXIgU3EuLCBOZXcgWW9yaywgTlkgMTAwMDQnXG4gICAgICAgICAgICAgICAgICAgICAgICBjb29yZGluYXRlczoge2xhdDogMCwgbG5nOiAwfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVzZXIgaXMgc2lnbmVkIG91dC5cbiAgICAgICAgICAgICAgICAgICAgZmlyZWJhc2UuYXV0aCgpLnNpZ25JbkFub255bW91c2x5KClcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycm9yKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhhbmRsZSBFcnJvcnMgaGVyZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlcnJvckNvZGUgPSBlcnJvci5jb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVycm9yTWVzc2FnZSA9IGVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydChlcnJvckNvZGUsICdcXG5VaC1vaCFcXG5Tb21ldGhpbmcgd2VudCB3cm9uZyEgJywgZXJyb3JNZXNzYWdlKVxuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0sXG4gICAgICAgIHByZXR0eVBsZWFzZTogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAvLyBHZXQgdXNlciBjb25zZW50ICsgZmluZCBjdXJyZW50IGxvY2F0aW9uXG4gICAgICAgICAgICByZXR1cm4gTm90aWZpY2F0aW9uLnJlcXVlc3RQZXJtaXNzaW9uKClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UgPT09ICdkZW5pZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdQbGVhc2UsIG9oIHBsZWFzZSwgZ2l2ZSB1cyBwZXJtaXNzaW9uIHRvIGFjY2VzcyB5b3VyIGxvY2F0aW9uLicpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ21hcCcsIHtcbiAgICAgICAgdXJsOiAnL21hcCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbWFwL21hcC5odG1sJ1xuICAgIH0pXG59KVxuLy8gLmNvbmZpZyhmdW5jdGlvbih1aUdtYXBHb29nbGVNYXBBcGlQcm92aWRlcikge1xuLy8gICAgIHVpR21hcEdvb2dsZU1hcEFwaVByb3ZpZGVyLmNvbmZpZ3VyZSh7XG4vLyAgICAgICAgIGtleTogJ0FJemFTeUR1UFo5dlY3NmJpTm5RYUQxc01zalB4b0hzc0tvMmlIYycsXG4vLyAgICAgICAgIHY6ICczLjIuMycsIC8vZGVmYXVsdHMgdG8gbGF0ZXN0IDMuWCBhbnlob3dcbi8vICAgICAgICAgbGlicmFyaWVzOiAnd2VhdGhlcixnZW9tZXRyeSx2aXN1YWxpemF0aW9uJ1xuLy8gICAgIH0pO1xuLy8gfSlcblxuIiwiYXBwLmZhY3RvcnkoJ0Z1bGxzdGFja1BpY3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CN2dCWHVsQ0FBQVhRY0UuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vZmJjZG4tc3Bob3Rvcy1jLWEuYWthbWFpaGQubmV0L2hwaG90b3MtYWsteGFwMS90MzEuMC04LzEwODYyNDUxXzEwMjA1NjIyOTkwMzU5MjQxXzgwMjcxNjg4NDMzMTI4NDExMzdfby5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItTEtVc2hJZ0FFeTlTSy5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3OS1YN29DTUFBa3c3eS5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItVWo5Q09JSUFJRkFoMC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I2eUl5RmlDRUFBcWwxMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFLVQ3NWxXQUFBbXFxSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFdlpBZy1WQUFBazkzMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFZ05NZU9YSUFJZkRoSy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFUXlJRE5XZ0FBdTYwQi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NDRjNUNVFXOEFFMmxHSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBZVZ3NVNXb0FBQUxzai5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBYUpJUDdVa0FBbElHcy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBUU93OWxXRUFBWTlGbC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItT1FiVnJDTUFBTndJTS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I5Yl9lcndDWUFBd1JjSi5wbmc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I1UFRkdm5DY0FFQWw0eC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I0cXdDMGlDWUFBbFBHaC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0IyYjMzdlJJVUFBOW8xRC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0J3cEl3cjFJVUFBdk8yXy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0JzU3NlQU5DWUFFT2hMdy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NKNHZMZnVVd0FBZGE0TC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJN3d6akVWRUFBT1BwUy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJZEh2VDJVc0FBbm5IVi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NHQ2lQX1lXWUFBbzc1Vi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJUzRKUElXSUFJMzdxdS5qcGc6bGFyZ2UnXG4gICAgXTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH07XG5cbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxuICAgICAgICAn44GT44KT44Gr44Gh44Gv44CB44Om44O844K244O85qeY44CCJyxcbiAgICAgICAgJ1dlbGNvbWUuIFRvLiBXRUJTSVRFLicsXG4gICAgICAgICc6RCcsXG4gICAgICAgICdZZXMsIEkgdGhpbmsgd2VcXCd2ZSBtZXQgYmVmb3JlLicsXG4gICAgICAgICdHaW1tZSAzIG1pbnMuLi4gSSBqdXN0IGdyYWJiZWQgdGhpcyByZWFsbHkgZG9wZSBmcml0dGF0YScsXG4gICAgICAgICdJZiBDb29wZXIgY291bGQgb2ZmZXIgb25seSBvbmUgcGllY2Ugb2YgYWR2aWNlLCBpdCB3b3VsZCBiZSB0byBuZXZTUVVJUlJFTCEnLFxuICAgIF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncmVldGluZ3M6IGdyZWV0aW5ncyxcbiAgICAgICAgZ2V0UmFuZG9tR3JlZXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc3RhdGUpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ01hcEN0cmwnXG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
