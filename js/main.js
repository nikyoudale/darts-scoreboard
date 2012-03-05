var possedartsModule = angular.module('possedarts', []);

possedartsModule.factory('Player', ['$resource', function($resource) {
  return $resource('/api/players', {}, {
    'getAll': {method: 'GET', isArray: true}
  });
}]);

possedartsModule.factory('PlayerScore', ['$resource', function($resource) {
  return $resource('/api/scores/:action', {}, {
    'submitNew': {method: 'POST', params: {'action' : 'new'}},
    'list' : {method: 'GET', params: {'action' : 'player', 'max' : 50}, isArray: true}
  });
}]);

possedartsModule.factory('PlayerStats', ['$resource', function($resource) {
  return $resource('/api/stats/player', {}, {
    'getAll' : {method: 'GET'}
  });
}]);

possedartsModule.factory('PlayerScoresService', ['PlayerScore', 'PlayerStats',
function(PlayerScore, PlayerStats) {
  var scoresByPlayerId = {};
  var statsByPlayerId = {};
  var waitingRequestCount = 0;
  
  return {
    submitScore: function(playerId, points, callbackFn) {
      waitingRequestCount++;
      PlayerScore.submitNew({'playerId' : playerId, 'score' : points},
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
    refreshPlayerScores: function(playerId) {
      waitingRequestCount++;
      var scoresList = PlayerScore.list({'playerId' : playerId, 'max' : 10},
        function() {
          scoresByPlayerId[playerId] = scoresList;
          waitingRequestCount--;
        },
        function() { waitingRequestCount--; } // error
      );
    },
    getPlayerStat: function(playerId, stat) {
      if (statsByPlayerId[playerId]) {
        return statsByPlayerId[playerId][stat];
      }
      return undefined;
    },
    refreshPlayerStats: function(playerId) {
      waitingRequestCount++;
      var stats = PlayerStats.getAll({'playerId' : playerId},
        function() {
          statsByPlayerId[playerId] = stats;
          waitingRequestCount--;
        },
        function() { waitingRequestCount--; } // error
      );
    },
    isLoading: function() {
      return waitingRequestCount != 0;
    },
    refreshPlayerData: function(playerId) {
      this.refreshPlayerScores(playerId);
      this.refreshPlayerStats(playerId);
    }
  }
}]);


function MainCtrl(Player, PlayerScoresService) {
  var thisCtrl = this;
  
  this._loading = true;
  
  this.players = Player.getAll({}, function() {
    $.each(thisCtrl.players, function(index, player) {
      PlayerScoresService.refreshPlayerData(player.id);
    });
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
