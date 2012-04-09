/* Setup keyboard shortcuts */
shortcut.add("left", function() {
  var inputs = $('.score-entry input[type="text"]');
  var focusedInput = $('input[type="text"]:focus').get(0);
  var newIndex = inputs.length-1;
  if (focusedInput) {
    var index = $.inArray(focusedInput, inputs);
    newIndex = Math.max(index-1, 0);
  }
  inputs.get(newIndex).focus();
});

shortcut.add("right", function() {
  var inputs = $('.score-entry input[type="text"]');
  var focusedInput = $('input[type="text"]:focus').get(0);
  var newIndex = 0;
  if (focusedInput) {
    var index = $.inArray(focusedInput, inputs);
    newIndex = Math.min(index+1, inputs.length-1);
  }
  inputs.get(newIndex).focus();
});




var possedartsModule = angular.module('possedarts', ['possedarts.stats']);

possedartsModule.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  $routeProvider.when('/stats', {template: '/templates/stats.html'})
  $routeProvider.otherwise({template: '/templates/main.html'})
}]);

possedartsModule.factory('Player', ['$resource', function($resource) {
  return $resource('/api/players', {}, {
    'getAll': {method: 'GET', isArray: true}
  });
}]);

possedartsModule.factory('PlayerScores', ['$resource', function($resource) {
  return $resource('/api/scores/:action', {}, {
    'submitNew': {method: 'POST', params: {'action' : 'new'}},
    'get' : {method: 'GET', params: {'action' : 'player', 'maxScores' : 50}}
  });
}]);

possedartsModule.factory('Rankings', ['$resource', function($resource) {
  return $resource('/api/scores/rankings', {}, {
    'get' : {method: 'GET'}
  });
}]);

possedartsModule.factory('PlayerScoresService', ['PlayerScores', 'Rankings',
function(PlayerScores, Rankings) {
  var scoresByPlayerId = {};
  var statsByPlayerId = {};
  var rankingsByStat = {};
  var waitingRequestCount = 0;

  return {
    submitScore: function(playerId, points, callbackFn) {
      waitingRequestCount++;
      PlayerScores.submitNew({'playerId' : playerId, 'score' : points},
        function() { if (callbackFn) callbackFn(); waitingRequestCount--; },
        function() { if (callbackFn) callbackFn(); waitingRequestCount--; } // error
      );
    },
    playerScores: function(playerId) {
      return scoresByPlayerId[playerId];
    },
    getCountOfPlayerScores: function(playerId) {
      return scoresByPlayerId[playerId] ? scoresByPlayerId[playerId].length : 0;
    },
    getPlayerStat: function(playerId, stat) {
      if (statsByPlayerId[playerId]) {
        return statsByPlayerId[playerId][stat];
      }
      return undefined;
    },
    getPlayerRanking: function(playerId, stat) {
      if (rankingsByStat[stat]) {
        return rankingsByStat[stat][playerId];
      }
      return undefined;
    },
    isLoading: function() {
      return waitingRequestCount != 0;
    },
    refreshPlayerData: function(playerId) {
      waitingRequestCount++;
      var scoresList = PlayerScores.get({'playerId' : playerId, 'maxScores' : 10},
        function() {
          scoresByPlayerId[playerId] = scoresList['scores'];
          statsByPlayerId[playerId] = scoresList['stats'];
          waitingRequestCount--;
        },
        function() { waitingRequestCount--; } // error
      );
    },
    refreshRankings: function() {
      waitingRequestCount++;
      var rankings = Rankings.get({},
        function() {
          rankingsByStat = rankings;
          waitingRequestCount--;
        },
        function() { waitingRequestCount--; } // error
      );
    }
  }
}]);

function localDateFromUTC(dateStr) {
  var d = new Date(0);
  d.setUTCSeconds(new Date(dateStr).getTime());
  return d;
}


var PRETTY_DATE_UPDATE_INTERVAL = 30000; // milliseconds

possedartsModule.directive('psPrettyDate', function() {
  return function(scope, element, attrs) {
    var expression = attrs.psPrettyDate;
    setInterval(function () {
      var date = scope.$eval(expression);
      var pretty = prettyDate(localDateFromUTC(date));
      element.html(prettyDate(localDateFromUTC(date)));
    }, PRETTY_DATE_UPDATE_INTERVAL);
    scope.$watch(expression, function(value, oldValue, scope) {
      element.html(prettyDate(localDateFromUTC(value)));
    });
  };
});

