app.config(function($stateProvider) {
    $stateProvider.state('map', {
        url: '/map',
        templateUrl: 'js/map/map.html'
    })
})
// .config(function(uiGmapGoogleMapApiProvider) {
//     uiGmapGoogleMapApiProvider.configure({
//         key: 'AIzaSyDuPZ9vV76biNnQaD1sMsjPxoHssKo2iHc',
//         v: '3.2.3', //defaults to latest 3.X anyhow
//         libraries: 'weather,geometry,visualization'
//     });
// })

