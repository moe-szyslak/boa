var app = angular.module('app', ['ngRoute', 'ngAnimate', 'ngTouch']);



app.controller('appCtrl', ['$rootScope', function ($rootScope) {
  $rootScope.io = null;

  $rootScope.$on('$routeChangeError', function (event, current, previous, rejection) {
    console.error(rejection);
  });

  $rootScope.$on('$routeChangeStart', function (event, target) {
  });

  $rootScope.$on('$routeChangeSuccess', function (event, target) {
  });

  $rootScope.connect = function () {
    // we will only establish connection once
    // after that socket.io engine will go to the end of earth to reconnect
    // we just sit back and enjoy the ride
    if ($rootScope.io === null) {
      $rootScope.io = io.connect();

      /* i think this is a bit too much info
      $rootScope.io.on('connect', function () {
        iPNotify({text: 'hurray, socket connection established', type: 'info'});
      });
      */

      $rootScope.io.on('message', function (data) {
        if (data.notify !== undefined) {
          iPNotify(data.notify);
        }

        switch(data.code) {
          // someone has created a new branch
          // emitted to everyone except for the branch creator
          // branch creator gets an ol' school JSON response from the server
          case 'NEW_BRANCH':
            $rootScope.$broadcast('NEW_BRANCH', data.newBranch);
          break;

          // someone has updated a branch info
          // emitted to everyone except for the branch updater
          // branch updater gets an ol' school JSON response from the server
          case 'UPDATED_BRANCH':
            $rootScope.$broadcast('UPDATED_BRANCH', data.updatedBranch);
          break;

          // i wonder what this one does --- oh, yes, someone has deleted shit
          // emitted to everyone except for the branch deleter
          // branch deleter gets an ol' school JSON response from the server
          case 'DELETED_BRANCH':
            $rootScope.$broadcast('DELETED_BRANCH', data.deletedBranchId);
          break;

          // MOVE-MOVE-MOVE
          // ping result shows a branch is down --- code BLACK!
          // emitted to ERYone
          case 'BLACK_HAWK_DOWN':
            $rootScope.$broadcast('BLACK_HAWK_DOWN', data.data);
          break;

          // branch as been reported
          // emitted to ERYone
          case 'AC-DC':
            $rootScope.$broadcast('AC-DC', data.report);
          break;
        };
      });

      // all errors are treated as suspicious --- i do NOT trust you son!
      $rootScope.io.on('error', function (data) {
        iPNotify({text: 'umm, what\'s up Doc?', type: 'error'});
      });
    }
  };

  // binding to couple of DOM events, menu to be exact
  // using activex class to avoid "collision" with bootstrap
  $('.menu a, .menu button').click(function (e) {
    $('.menu a, .menu button').removeClass('activex');
    $(this).addClass('activex');
  });

  $rootScope.appCtrl = this;
}]);



// just preparing, making sure we don't forget stuff
app.config(function($sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist([
    'self',
    'http://boa*.herokuapp.org/**'
  ]);
});



// we're going to intercept request and look out for anything suspicious
// meaning: we're going to look for property 'notify' and call `iPNotify`
// that's pretty much it --- talk about overkill :)
app.config(function ($routeProvider, $httpProvider, $locationProvider) {
  $httpProvider.interceptors.push(function ($rootScope, $q) {
    return {
     'request': function(config) {
        $rootScope.httpInProgress = true;
        return config;
      },

      'response': function(response) {
        $rootScope.httpInProgress = false;
        if (response.data.notify !== undefined) {
          iPNotify(response.data.notify)
        }

        return response;
      },

      'responseError': function (rejection) {
        $rootScope.httpInProgress = false;

        if (rejection.data.notify !== undefined) {
          iPNotify(rejection.data.notify)
        }

        return $q.reject(rejection);
      }
    };
  });

  $routeProvider.when('/', {
    templateUrl: 'templates/pingu.html',
    controller: 'pinguCtrl',
    resolve: {
      socket:   pinguCtrl.socket,
      branches: pinguCtrl.branches,
      reports:  pinguCtrl.reports
    }
  }).

  when('/login', {
    templateUrl: 'templates/login.html',
    controller: 'loginCtrl'
  }).

  when('/stat', {
    templateUrl: 'templates/stat.html',
    controller: 'statCtrl'
  }).

  when('/users', {
    templateUrl: 'templates/users.html',
    controller: 'usersCtrl'
  }).

  when('/log', {
    templateUrl: 'templates/log.html',
    controller: 'logCtrl'
  }).

  otherwise({
    redirectTo: '/login'
  });

  $locationProvider.html5Mode(true);
});
