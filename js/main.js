var possedartsModule = angular.module('possedarts', []);

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
        function() {
          if (callbackFn) {
            callbackFn();
          }
          waitingRequestCount--;
        },
        function() { waitingRequestCount--; } // error
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

angular.directive('ps:prettydate', function(expression, compileElement) {
  return function(linkElement) {
    var thisObj = this;
    setInterval(function () {
      var date = thisObj.$eval(expression);
      var pretty = prettyDate(localDateFromUTC(date));
      linkElement.html(prettyDate(localDateFromUTC(date)));
    }, PRETTY_DATE_UPDATE_INTERVAL);
    this.$watch(expression, function(scope, value, oldValue) {
      linkElement.html(prettyDate(localDateFromUTC(value)));
    });
  };
});


function MainCtrl(Player, PlayerScoresService) {
  var thisCtrl = this;
  
  this._loading = true;
  
  this.players = Player.getAll({}, function() {
    $.each(thisCtrl.players, function(index, player) {
      PlayerScoresService.refreshPlayerData(player.id);
    });
    PlayerScoresService.refreshRankings();
    thisCtrl._loading = false;
  });
  
  this.isPeformingRequest = function() {
    return PlayerScoresService.isLoading();
  }
}
MainCtrl.$inject = ['Player', 'PlayerScoresService'];


function PlayerStatsCtrl(PlayerScoresService) {
  var thisCtrl = this;
  
  this.get14DayMax = function() {
    return PlayerScoresService.getPlayerStat(this.player.id, 'max-14-day');
  }
  
  this.get14DayMean = function() {
    return PlayerScoresService.getPlayerStat(this.player.id, 'mean-14-day');
  }
  
  this.get14DayMaxRanking = function() {
    return PlayerScoresService.getPlayerRanking(this.player.id, 'max-14-day');
  }
  
  this.get14DayMeanRanking = function() {
    return PlayerScoresService.getPlayerRanking(this.player.id, 'mean-14-day');
  }
  
  this.hasEnoughStats = function() {
    return PlayerScoresService.getCountOfPlayerScores(this.player.id) >= 5;
  }
}
PlayerStatsCtrl.$inject = ['PlayerScoresService'];


function ScoreEntryCtrl(PlayerScoresService) {
  var thisCtrl = this;
  
  this.submitScores = function() {
    $.each(this.players, function(index, player) {
      if (player.newScore > 0) {
        PlayerScoresService.submitScore(player.id, player.newScore, function() {
          PlayerScoresService.refreshPlayerData(player.id);
        });
      }
      PlayerScoresService.refreshRankings();
      player.newScore = "";
    });
  }
}
ScoreEntryCtrl.$inject = ['PlayerScoresService'];


function PlayerScoresListCtrl(PlayerScoresService) {
  var thisCtrl = this;
  
  this.getScores = function() {
    return PlayerScoresService.playerScores(this.player.id);
  }
}
PlayerScoresListCtrl.$inject = ['PlayerScoresService'];
