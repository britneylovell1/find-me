app.directive('navbar', function ($rootScope, $state) {

    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/navbar/navbar.html',
        controller: 'MapCtrl'
    };

});
