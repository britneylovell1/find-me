'use strict';

window.app = angular.module('FullstackGeneratedApp', ['fsaPreBuilt', 'ui.router', 'ui.bootstrap', 'ngAnimate']);

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

// Update directions everytime a user's location changes

function calculateAndDisplayRoute(directionsService, directionsDisplay) {
    // console.log('in calculateAndDisplayRoute');

    var marco;
    var polo;

    // Grab marco and polo from firebase
    firebase.database().ref('users/').limitToFirst(2).once('value', function (snapshot) {

        var userArray = [];
        snapshot.forEach(function (user) {
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

function getLocation(user, marker) {

    // Get my current location, please
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {

            youFoundMe(user, position);
        }, function () {

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
    geocoder.geocode({ 'latLng': coords }, function (results, status) {

        if (status == google.maps.GeocoderStatus.OK) {

            // If the geolocation was recognized and an address was found
            if (results[0]) {

                // Compose a string with the address parts
                var address = results[0].address_components[1].long_name + ' ' + results[0].address_components[0].long_name + ', ' + results[0].address_components[3].long_name;

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
        content: browserHasGeolocation ? 'Error: The Geolocation service failed.' : 'Error: Your browser doesn\'t support geolocation.'
    });

    // marker.setContent(browserHasGeolocation ?
    //         'Error: The Geolocation service failed.' :
    //         'Error: Your browser doesn\'t support geolocation.');
}

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
firebase.database().ref('users/').on('child_changed', function () {
    calculateAndDisplayRoute(directionsService, directionsDisplay);
});

// How do I send separate information to getDirections()? Maybe send token instead of coordinates?

// variables
var map;
var geocoder;
var directionsService;
var directionsDisplay;

// Create a map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 40.7128, lng: -74.0059 },
        zoom: 10
    });
    geocoder = new google.maps.Geocoder();
    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsDisplay.setMap(map);

    google.maps.event.addListenerOnce(map, 'tilesloaded', function () {
        getUser();
    });
}

// Create a new user in firebase

function getUser() {

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            // User is signed in.
            var userId = user.uid;

            // Assign new user a default address
            firebase.database().ref('users/' + userId).set({
                address: '5 Hanover Sq., New York, NY 10004'
            });

            // Get user consent + find current location
            Notification.requestPermission().then(function (response) {

                if (response === 'denied') {
                    alert('Please, oh please, give us permission to access your location.');
                }

                getLocation(userId);
            }).catch(function (error) {

                console.log(error);
            });

            // Remove users once disconnected
            firebase.database().ref('users/' + userId).onDisconnect().remove(function (error) {
                console.log(error);
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
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function link(scope) {

            scope.sent = false;

            scope.locationLink = 'localhost:1337';

            // scope.travelModes = [ 'driving', 'biking', 'transit', 'walking'];

            // scope.user = null;

            // scope.isLoggedIn = function () {
            //     return AuthService.isAuthenticated();
            // };

            // scope.logout = function () {
            //     AuthService.logout().then(function () {
            //        $state.go('home');
            //     });
            // };

            // var setUser = function () {
            //     AuthService.getLoggedInUser().then(function (user) {
            //         scope.user = user;
            //     });
            // };

            // var removeUser = function () {
            //     scope.user = null;
            // };

            // setUser();

            // $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            // $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            // $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
        }

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZpcmViYXNlL2RpcmVjdGlvbnMuanMiLCJmaXJlYmFzZS9maXJlYmFzZS5qcyIsImZpcmViYXNlL2dlb2xvY2F0aW9uLmpzIiwiZmlyZWJhc2UvaW5kZXguanMiLCJmaXJlYmFzZS9tYXAuanMiLCJmaXJlYmFzZS9uZXctdXNlci5qcyIsImZzYS9mc2EtcHJlLWJ1aWx0LmpzIiwiaG9tZS9ob21lLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQSxPQUFBLEdBQUEsR0FBQSxRQUFBLE1BQUEsQ0FBQSx1QkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7QUFDQTtBQUNBLHNCQUFBLFNBQUEsQ0FBQSxJQUFBO0FBQ0E7QUFDQSx1QkFBQSxTQUFBLENBQUEsR0FBQTtBQUNBO0FBQ0EsdUJBQUEsSUFBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTtBQUNBLGVBQUEsUUFBQSxDQUFBLE1BQUE7QUFDQSxLQUZBO0FBR0EsQ0FUQTs7QUFXQTtBQUNBLElBQUEsR0FBQSxDQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUE7QUFDQSxRQUFBLCtCQUFBLFNBQUEsNEJBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxlQUFBLE1BQUEsSUFBQSxJQUFBLE1BQUEsSUFBQSxDQUFBLFlBQUE7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LEdBQUEsR0FBQSxHQUFBLFFBQUEsQ0FBQSxFQUFBLGtCQUFBLENBQUEsQ0FBQSxFQUFBLFNBQUEsR0FBQSxJQUFBLEdBQUEsUUFBQSxDQUFBLEVBQUEsa0JBQUEsQ0FBQSxDQUFBLEVBQUEsU0FBQTs7QUFFQTtBQUNBLHlCQUFBLFFBQUEsR0FBQSxHQUFBLENBQUEsV0FBQSxJQUFBLEVBQUEsTUFBQSxDQUFBO0FBQ0EsNkJBQUE7QUFEQSxpQkFBQTtBQUlBO0FBQ0EsU0FkQSxNQWNBOztBQUVBO0FBQ0Esa0JBQUEsNkJBQUEsTUFBQTtBQUVBO0FBRUEsS0F2QkE7QUF5QkE7O0FBRUEsU0FBQSxtQkFBQSxDQUFBLHFCQUFBLEVBQUEsR0FBQSxFQUFBOztBQUVBO0FBQ0EsUUFBQSxTQUFBLElBQUEsT0FBQSxJQUFBLENBQUEsTUFBQSxDQUFBO0FBQ0Esa0JBQUEsR0FEQTtBQUVBLGFBQUEsR0FGQTtBQUdBLGlCQUFBLHdCQUNBLHdDQURBLEdBRUE7QUFMQSxLQUFBLENBQUE7O0FBUUE7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQUEsaUJBQUEsQ0FBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQTtBQUNBLFlBQUEsR0FBQSxDQUFBLFdBQUE7QUFDQTtBQUNBLGFBQUEsUUFBQSxHQUFBLEdBQUEsQ0FBQSxXQUFBLE1BQUEsRUFBQSxNQUFBLENBQUE7QUFDQSxhQUFBLEdBREE7QUFFQSxhQUFBO0FBRkEsS0FBQTtBQUlBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxTQUFBLFFBQUEsR0FBQSxHQUFBLENBQUEsUUFBQSxFQUFBLEVBQUEsQ0FBQSxlQUFBLEVBQUEsWUFBQTtBQUNBLDZCQUFBLGlCQUFBLEVBQUEsaUJBQUE7QUFDQSxDQUZBOztBQUlBOztBQzFDQTtBQUNBLElBQUEsR0FBQTtB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QUFBO0FBQ0Esa0JBQUEsR0FEQTtBQUVBLHFCQUFBO0FBRkEsS0FBQTtBQUlBLENBTEE7QUNBQSxJQUFBLFNBQUEsQ0FBQSxRQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUEsV0FBQTtBQUNBLGtCQUFBLEdBREE7QUFFQSxlQUFBLEVBRkE7QUFHQSxxQkFBQSx5Q0FIQTtBQUlBLGNBQUEsY0FBQSxLQUFBLEVBQUE7O0FBRUEsa0JBQUEsSUFBQSxHQUFBLEtBQUE7O0FBRUEsa0JBQUEsWUFBQSxHQUFBLGdCQUFBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUVBOztBQXhDQSxLQUFBO0FBNENBLENBOUNBOztBQ0FBLElBQUEsU0FBQSxDQUFBLGVBQUEsRUFBQSxVQUFBLGVBQUEsRUFBQTs7QUFFQSxXQUFBO0FBQ0Esa0JBQUEsR0FEQTtBQUVBLHFCQUFBLHlEQUZBO0FBR0EsY0FBQSxjQUFBLEtBQUEsRUFBQTtBQUNBLGtCQUFBLFFBQUEsR0FBQSxnQkFBQSxpQkFBQSxFQUFBO0FBQ0E7QUFMQSxLQUFBO0FBUUEsQ0FWQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCIvLyBHb29nbGUgZGlyZWN0aW9uc1xuXG4vLyBVcGRhdGUgZGlyZWN0aW9ucyBldmVyeXRpbWUgYSB1c2VyJ3MgbG9jYXRpb24gY2hhbmdlc1xuXG5mdW5jdGlvbiBjYWxjdWxhdGVBbmREaXNwbGF5Um91dGUoZGlyZWN0aW9uc1NlcnZpY2UsIGRpcmVjdGlvbnNEaXNwbGF5KSB7XG4gICAgLy8gY29uc29sZS5sb2coJ2luIGNhbGN1bGF0ZUFuZERpc3BsYXlSb3V0ZScpO1xuXG4gICAgdmFyIG1hcmNvO1xuICAgIHZhciBwb2xvO1xuXG4gICAgLy8gR3JhYiBtYXJjbyBhbmQgcG9sbyBmcm9tIGZpcmViYXNlXG4gICAgZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoJ3VzZXJzLycpLmxpbWl0VG9GaXJzdCgyKS5vbmNlKCd2YWx1ZScsIGZ1bmN0aW9uKHNuYXBzaG90KSB7XG5cbiAgICAgICAgdmFyIHVzZXJBcnJheSA9IFtdO1xuICAgICAgICBzbmFwc2hvdC5mb3JFYWNoKGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgICAgIHVzZXJBcnJheS5wdXNoKHVzZXIudmFsKCkpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBtYXJjbyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcodXNlckFycmF5WzBdLmxhdCwgdXNlckFycmF5WzBdLmxuZyk7XG4gICAgICAgIC8vIHBvbG8gPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKHVzZXJBcnJheVsxXS5sYXQsIHVzZXJBcnJheVsxXS5sbmcpO1xuXG4gICAgICAgIG1hcmNvID0gdXNlckFycmF5WzBdLmFkZHJlc3M7XG4gICAgICAgIHBvbG8gPSB1c2VyQXJyYXlbMV0uYWRkcmVzcztcblxuICAgIH0pO1xuXG5cblxuICAgIC8vIEhvdyBkbyBJIGFjY2VzcyB0aGUgY29vcmRpbmF0ZXMgZm9yIGVhY2ggdXNlciBoZXJlP1xuICAgIGRpcmVjdGlvbnNTZXJ2aWNlLnJvdXRlKHtcbiAgICAgICAgICAgIG9yaWdpbjogbWFyY28sXG4gICAgICAgICAgICBkZXN0aW5hdGlvbjogcG9sbyxcbiAgICAgICAgICAgIHRyYXZlbE1vZGU6ICdXQUxLSU5HJ1xuICAgICAgICB9LFxuXG4gICAgICAgIGZ1bmN0aW9uKHJlc3BvbnNlLCBzdGF0dXMpIHtcbiAgICAgICAgICAgIGlmIChzdGF0dXMgPT09ICdPSycpIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb25zRGlzcGxheS5zZXREaXJlY3Rpb25zKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmFsZXJ0KCdEaXJlY3Rpb25zIHJlcXVlc3QgZmFpbGVkIGR1ZSB0byAnICsgc3RhdHVzKTtcbiAgICAgICAgICAgIH1cbiAgICB9KTtcbn07XG4iLCIvLyBJbml0aWFsaXplIEZpcmViYXNlXG52YXIgY29uZmlnID0ge1xuICAgIGFwaUtleTogXCJBSXphU3lBRllVYnA3X1FoYWlNSVFOM0l3azU0ZFhNeFFKOGtNX29cIixcbiAgICBhdXRoRG9tYWluOiBcImdoLWZpbmQtbWUuZmlyZWJhc2VhcHAuY29tXCIsXG4gICAgZGF0YWJhc2VVUkw6IFwiaHR0cHM6Ly9naC1maW5kLW1lLmZpcmViYXNlaW8uY29tXCIsXG4gICAgc3RvcmFnZUJ1Y2tldDogXCJnaC1maW5kLW1lLmFwcHNwb3QuY29tXCIsXG59O1xuXG5maXJlYmFzZS5pbml0aWFsaXplQXBwKGNvbmZpZyk7XG4iLCIvLyBHb29nbGUgR2VvbG9jYXRpb25cblxuZnVuY3Rpb24gZ2V0TG9jYXRpb24odXNlciwgbWFya2VyKSB7XG5cbiAgICAvLyBHZXQgbXkgY3VycmVudCBsb2NhdGlvbiwgcGxlYXNlXG4gICAgaWYgKG5hdmlnYXRvci5nZW9sb2NhdGlvbikge1xuICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGZ1bmN0aW9uKHBvc2l0aW9uKSB7XG5cbiAgICAgICAgICAgIHlvdUZvdW5kTWUodXNlciwgcG9zaXRpb24pO1xuXG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICBoYW5kbGVMb2NhdGlvbkVycm9yKHRydWUsIG1hcC5nZXRDZW50ZXIoKSk7XG5cbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcblxuICAgICAgICBoYW5kbGVMb2NhdGlvbkVycm9yKGZhbHNlLCBtYXAuZ2V0Q2VudGVyKCkpO1xuXG4gICAgfVxufTtcblxuLy8gR2VvbG9jYXRpb24gc3VjY2Vzcy9lcnJvciBoYW5kbGVyc1xuZnVuY3Rpb24geW91Rm91bmRNZSh1c2VyLCBwb3NpdGlvbikge1xuXG4gICAgLy8gQ29udmVydCBjdXJyZW50IGxvY2F0aW9uIHRvIGNvb3JkaW5hdGVzXG4gICAgdmFyIGNvb3JkcyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcocG9zaXRpb24uY29vcmRzLmxhdGl0dWRlLCBwb3NpdGlvbi5jb29yZHMubG9uZ2l0dWRlKTtcblxuICAgIC8vIENoZWNrIGlmIGNvb3JkcyBhcmUgYSBHb29nbGUtYXBwcm92ZWQgYWRkcmVzc1xuICAgIGdlb2NvZGVyLmdlb2NvZGUoeydsYXRMbmcnOiBjb29yZHN9LCBmdW5jdGlvbihyZXN1bHRzLCBzdGF0dXMpIHtcblxuICAgIGlmIChzdGF0dXMgPT0gZ29vZ2xlLm1hcHMuR2VvY29kZXJTdGF0dXMuT0spIHtcblxuICAgICAgLy8gSWYgdGhlIGdlb2xvY2F0aW9uIHdhcyByZWNvZ25pemVkIGFuZCBhbiBhZGRyZXNzIHdhcyBmb3VuZFxuICAgICAgaWYgKHJlc3VsdHNbMF0pIHtcblxuICAgICAgICAvLyBDb21wb3NlIGEgc3RyaW5nIHdpdGggdGhlIGFkZHJlc3MgcGFydHNcbiAgICAgICAgdmFyIGFkZHJlc3MgPSByZXN1bHRzWzBdLmFkZHJlc3NfY29tcG9uZW50c1sxXS5sb25nX25hbWUrJyAnK3Jlc3VsdHNbMF0uYWRkcmVzc19jb21wb25lbnRzWzBdLmxvbmdfbmFtZSsnLCAnK3Jlc3VsdHNbMF0uYWRkcmVzc19jb21wb25lbnRzWzNdLmxvbmdfbmFtZVxuXG4gICAgICAgIC8vIFVwZGF0ZSB1c2VyJ3MgYWRkcmVzcyBpbiBmaXJlYmFzZVxuICAgICAgICBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZigndXNlcnMvJyArIHVzZXIpLnVwZGF0ZSh7XG4gICAgICAgICAgICBhZGRyZXNzOiBhZGRyZXNzXG4gICAgICAgIH0pO1xuXG4gICAgICB9XG4gICAgfSBlbHNlIHtcblxuICAgICAgLy8gaWYgdGhlIGFkZHJlc3MgY291bGRuJ3QgYmUgZGV0ZXJtaW5lZCwgYWxlcnQgYW5kIGVycm9yIHdpdGggdGhlIHN0YXR1cyBtZXNzYWdlXG4gICAgICBhbGVydChcIkdlb2NvZGVyIGZhaWxlZCBkdWUgdG86IFwiICsgc3RhdHVzKTtcblxuICAgIH1cblxuICB9KTtcblxufVxuXG5mdW5jdGlvbiBoYW5kbGVMb2NhdGlvbkVycm9yKGJyb3dzZXJIYXNHZW9sb2NhdGlvbiwgcG9zKSB7XG5cbiAgICAvLyBTZXQgbWFya2VyIG9uIGRlZmF1bHQgcG9zaXRpb24gb24gbWFwXG4gICAgdmFyIG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgcG9zaXRpb246IHBvcyxcbiAgICAgICAgICAgIG1hcDogbWFwLFxuICAgICAgICAgICAgY29udGVudDogYnJvd3Nlckhhc0dlb2xvY2F0aW9uID9cbiAgICAgICAgICAgICAgICAnRXJyb3I6IFRoZSBHZW9sb2NhdGlvbiBzZXJ2aWNlIGZhaWxlZC4nIDpcbiAgICAgICAgICAgICAgICAnRXJyb3I6IFlvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCBnZW9sb2NhdGlvbi4nXG4gICAgICAgICAgfSk7XG5cbiAgICAvLyBtYXJrZXIuc2V0Q29udGVudChicm93c2VySGFzR2VvbG9jYXRpb24gP1xuICAgIC8vICAgICAgICAgJ0Vycm9yOiBUaGUgR2VvbG9jYXRpb24gc2VydmljZSBmYWlsZWQuJyA6XG4gICAgLy8gICAgICAgICAnRXJyb3I6IFlvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCBnZW9sb2NhdGlvbi4nKTtcbn1cbiIsIi8vIGZpcmViYXNlLmF1dGgoKS5jdXJyZW50VXNlcigpXG5cbi8vIFVwZGF0ZSB1c2VyIGNvb3JkaW5hdGVzIGFzIHRoZXkgcHJvZ3Jlc3Ncbi8vIFNob3VsZCBJIHNldCB1cCBhIHNldEludGVydmFsIGZ1bmN0aW9uIHRoYXQgdXBkYXRlcyBldmVyeSBzbyBvZnRlbj9cbi8vIFdoZXJlIGRvIEkgcHV0IHRoZSByZW9jY3VyaW5nIHVwZGF0ZUNvb3JkaW5hdGVzKCkgZnVuY3Rpb24/XG5mdW5jdGlvbiB1cGRhdGVDb29yZGluYXRlcyh1c2VySWQsIGxuZywgbGF0KSB7XG4gICAgY29uc29sZS5sb2coJ2luIHVwZGF0ZScpO1xuICAgIC8vIGdldExvY2F0aW9uKCk7XG4gICAgZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoJ3VzZXJzLycgKyB1c2VySWQpLnVwZGF0ZSh7XG4gICAgICAgIGxhdDogbGF0LFxuICAgICAgICBsbmc6IGxuZ1xuICAgIH0pO1xufVxuXG4vLyAvLyBEbyBJIG5lZWQgdGhpcyBmdW5jdGlvbj9cbi8vIGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKCd1c2Vycy8nKS5vbignY2hpbGRfYWRkZWQnLCBmdW5jdGlvbih1c2VyKSB7XG5cbi8vICAgICBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZigndXNlcnMvJykuXG4vLyAgICAgaWYoIXVzZXIubmFtZSkge1xuLy8gICAgICAgICBmaXJlYmFzZS5kYXRhYmFzZSgpLnJlZigndXNlcnMvJyArIHVzZXIua2V5KS5zZXQoe1xuLy8gICAgICAgICAgICAgICAgIG5hbWU6ICdtYXJjbycsXG4vLyAgICAgICAgICAgICAgICAgbGF0OiAwLFxuLy8gICAgICAgICAgICAgICAgIGxuZzogMFxuLy8gICAgICAgICAgICAgfSk7XG4vLyAgICAgfSBlbHNlIGlmICh1c2VyLm5hbWUgPT09ICdtYXJjbycpIHtcbi8vICAgICAgICAgZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoJ3VzZXJzLycgKyB1c2VyLmtleSkuc2V0KHtcbi8vICAgICAgICAgICAgICAgICBuYW1lOiAncG9sbycsXG4vLyAgICAgICAgICAgICAgICAgbGF0OiAwLFxuLy8gICAgICAgICAgICAgICAgIGxuZzogMFxuLy8gICAgICAgICAgICAgfSk7XG4vLyAgICAgfVxuLy8gICAgIC8vIEluaXRpYWxpemUgZGlyZWN0aW9uc1xuLy8gICAgIC8vIEJlIHN1cmUgdG8gc2VuZCBjb29yZGluYXRlcyBmb3IgdGhpc1xuLy8gICAgIC8vIGdldERpcmVjdGlvbnMoKTtcbi8vIH0pO1xuXG4vLyAvLyBSZXRyaWV2ZSBkYXRhIGFzIHVzZXIgbG9jYXRpb25zIGFyZSB1cGRhdGVkXG4vLyAvLyBUaGlzIGlzIG5vdyBvbkNoYW5nZUhhbmRsZXIoKVxuZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoJ3VzZXJzLycpLm9uKCdjaGlsZF9jaGFuZ2VkJywgZnVuY3Rpb24oKSB7XG4gICAgY2FsY3VsYXRlQW5kRGlzcGxheVJvdXRlKGRpcmVjdGlvbnNTZXJ2aWNlLCBkaXJlY3Rpb25zRGlzcGxheSk7XG59KTtcblxuLy8gSG93IGRvIEkgc2VuZCBzZXBhcmF0ZSBpbmZvcm1hdGlvbiB0byBnZXREaXJlY3Rpb25zKCk/IE1heWJlIHNlbmQgdG9rZW4gaW5zdGVhZCBvZiBjb29yZGluYXRlcz9cbiIsIi8vIHZhcmlhYmxlc1xudmFyIG1hcDtcbnZhciBnZW9jb2RlcjtcbnZhciBkaXJlY3Rpb25zU2VydmljZTtcbnZhciBkaXJlY3Rpb25zRGlzcGxheTtcblxuXG4vLyBDcmVhdGUgYSBtYXBcbmZ1bmN0aW9uIGluaXRNYXAoKSB7XG4gICAgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyksIHtcbiAgICAgICAgY2VudGVyOiB7bGF0OiA0MC43MTI4LCBsbmc6IC03NC4wMDU5fSxcbiAgICAgICAgem9vbTogMTBcbiAgICB9KTtcbiAgICBnZW9jb2RlciA9IG5ldyBnb29nbGUubWFwcy5HZW9jb2RlcigpO1xuICAgIGRpcmVjdGlvbnNTZXJ2aWNlID0gbmV3IGdvb2dsZS5tYXBzLkRpcmVjdGlvbnNTZXJ2aWNlO1xuICAgIGRpcmVjdGlvbnNEaXNwbGF5ID0gbmV3IGdvb2dsZS5tYXBzLkRpcmVjdGlvbnNSZW5kZXJlcjtcbiAgICBkaXJlY3Rpb25zRGlzcGxheS5zZXRNYXAobWFwKTtcblxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyT25jZShtYXAsICd0aWxlc2xvYWRlZCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgIGdldFVzZXIoKTtcbiAgICB9KTtcbn1cblxuIiwiLy8gQ3JlYXRlIGEgbmV3IHVzZXIgaW4gZmlyZWJhc2VcblxuZnVuY3Rpb24gZ2V0VXNlcigpIHtcblxuICAgIGZpcmViYXNlLmF1dGgoKS5vbkF1dGhTdGF0ZUNoYW5nZWQoZnVuY3Rpb24odXNlcikge1xuICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgLy8gVXNlciBpcyBzaWduZWQgaW4uXG4gICAgICAgICAgICB2YXIgdXNlcklkID0gdXNlci51aWQ7XG5cbiAgICAgICAgICAgIC8vIEFzc2lnbiBuZXcgdXNlciBhIGRlZmF1bHQgYWRkcmVzc1xuICAgICAgICAgICAgZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoJ3VzZXJzLycgKyB1c2VySWQpLnNldCh7XG4gICAgICAgICAgICAgICAgYWRkcmVzczogJzUgSGFub3ZlciBTcS4sIE5ldyBZb3JrLCBOWSAxMDAwNCdcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBHZXQgdXNlciBjb25zZW50ICsgZmluZCBjdXJyZW50IGxvY2F0aW9uXG4gICAgICAgICAgICBOb3RpZmljYXRpb24ucmVxdWVzdFBlcm1pc3Npb24oKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZSA9PT0gJ2RlbmllZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ1BsZWFzZSwgb2ggcGxlYXNlLCBnaXZlIHVzIHBlcm1pc3Npb24gdG8gYWNjZXNzIHlvdXIgbG9jYXRpb24uJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZ2V0TG9jYXRpb24odXNlcklkKTtcblxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnJvcikge1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAvLyBSZW1vdmUgdXNlcnMgb25jZSBkaXNjb25uZWN0ZWRcbiAgICAgICAgICAgIGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKCd1c2Vycy8nICsgdXNlcklkKS5vbkRpc2Nvbm5lY3QoKS5yZW1vdmUoZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVXNlciBpcyBzaWduZWQgb3V0LlxuICAgICAgICAgICAgZmlyZWJhc2UuYXV0aCgpLnNpZ25JbkFub255bW91c2x5KCkuY2F0Y2goZnVuY3Rpb24oZXJyb3IpIHtcblxuICAgICAgICAgICAgICAgIC8vIEhhbmRsZSBFcnJvcnMgaGVyZS5cbiAgICAgICAgICAgICAgICB2YXIgZXJyb3JDb2RlID0gZXJyb3IuY29kZTtcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3JNZXNzYWdlID0gZXJyb3IubWVzc2FnZTtcbiAgICAgICAgICAgICAgICBhbGVydChlcnJvckNvZGUsICdcXG5VaC1vaCFcXG5Tb21ldGhpbmcgd2VudCB3cm9uZyEgJywgZXJyb3JNZXNzYWdlKVxuXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuIiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ob21lL2hvbWUuaHRtbCdcbiAgICB9KTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ0Z1bGxzdGFja1BpY3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CN2dCWHVsQ0FBQVhRY0UuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vZmJjZG4tc3Bob3Rvcy1jLWEuYWthbWFpaGQubmV0L2hwaG90b3MtYWsteGFwMS90MzEuMC04LzEwODYyNDUxXzEwMjA1NjIyOTkwMzU5MjQxXzgwMjcxNjg4NDMzMTI4NDExMzdfby5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItTEtVc2hJZ0FFeTlTSy5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3OS1YN29DTUFBa3c3eS5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItVWo5Q09JSUFJRkFoMC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I2eUl5RmlDRUFBcWwxMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFLVQ3NWxXQUFBbXFxSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFdlpBZy1WQUFBazkzMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFZ05NZU9YSUFJZkRoSy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFUXlJRE5XZ0FBdTYwQi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NDRjNUNVFXOEFFMmxHSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBZVZ3NVNXb0FBQUxzai5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBYUpJUDdVa0FBbElHcy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBUU93OWxXRUFBWTlGbC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItT1FiVnJDTUFBTndJTS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I5Yl9lcndDWUFBd1JjSi5wbmc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I1UFRkdm5DY0FFQWw0eC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I0cXdDMGlDWUFBbFBHaC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0IyYjMzdlJJVUFBOW8xRC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0J3cEl3cjFJVUFBdk8yXy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0JzU3NlQU5DWUFFT2hMdy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NKNHZMZnVVd0FBZGE0TC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJN3d6akVWRUFBT1BwUy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJZEh2VDJVc0FBbm5IVi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NHQ2lQX1lXWUFBbzc1Vi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJUzRKUElXSUFJMzdxdS5qcGc6bGFyZ2UnXG4gICAgXTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH07XG5cbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxuICAgICAgICAn44GT44KT44Gr44Gh44Gv44CB44Om44O844K244O85qeY44CCJyxcbiAgICAgICAgJ1dlbGNvbWUuIFRvLiBXRUJTSVRFLicsXG4gICAgICAgICc6RCcsXG4gICAgICAgICdZZXMsIEkgdGhpbmsgd2VcXCd2ZSBtZXQgYmVmb3JlLicsXG4gICAgICAgICdHaW1tZSAzIG1pbnMuLi4gSSBqdXN0IGdyYWJiZWQgdGhpcyByZWFsbHkgZG9wZSBmcml0dGF0YScsXG4gICAgICAgICdJZiBDb29wZXIgY291bGQgb2ZmZXIgb25seSBvbmUgcGllY2Ugb2YgYWR2aWNlLCBpdCB3b3VsZCBiZSB0byBuZXZTUVVJUlJFTCEnLFxuICAgIF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncmVldGluZ3M6IGdyZWV0aW5ncyxcbiAgICAgICAgZ2V0UmFuZG9tR3JlZXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgICAgICBzY29wZS5zZW50ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHNjb3BlLmxvY2F0aW9uTGluayA9ICdsb2NhbGhvc3Q6MTMzNydcblxuICAgICAgICAgICAgLy8gc2NvcGUudHJhdmVsTW9kZXMgPSBbICdkcml2aW5nJywgJ2Jpa2luZycsICd0cmFuc2l0JywgJ3dhbGtpbmcnXTtcblxuICAgICAgICAgICAgLy8gc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIC8vIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgLy8gfTtcblxuICAgICAgICAgICAgLy8gc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICAgICAgLy8gICAgIH0pO1xuICAgICAgICAgICAgLy8gfTtcblxuICAgICAgICAgICAgLy8gdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgIC8vICAgICB9KTtcbiAgICAgICAgICAgIC8vIH07XG5cbiAgICAgICAgICAgIC8vIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgLy8gfTtcblxuICAgICAgICAgICAgLy8gc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAvLyAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgLy8gJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAvLyAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
