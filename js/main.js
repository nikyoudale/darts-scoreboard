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
  
  return {
    playerScores: function(playerId) {
      return scoresByPlayerId[playerId];
    },
    refreshPlayerScores: function(playerId) {
      var scoresList = PlayerScore.list({'playerId' : playerId, 'max' : 10},
        function() {
          scoresByPlayerId[playerId] = scoresList;
        }
      );
    },
    getPlayerStat: function(playerId, stat) {
      if (statsByPlayerId[playerId]) {
        return statsByPlayerId[playerId][stat];
      }
      return undefined;
    },
    refreshPlayerStats: function(playerId) {
      var stats = PlayerStats.getAll({'playerId' : playerId},
        function() {
          statsByPlayerId[playerId] = stats;
        }
      );
    }
  }
}]);


function MainCtrl(Player, PlayerScoresService) {
  var thisCtrl = this;
  
  this.players = Player.getAll({}, function() {
    $.each(thisCtrl.players, function(index, player) {
      PlayerScoresService.refreshPlayerScores(player.id);
      PlayerScoresService.refreshPlayerStats(player.id);
    });
  });
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
}
PlayerStatsCtrl.$inject = ['PlayerScoresService'];


function ScoreEntryCtrl(PlayerScore, PlayerScoresService) {
  var thisCtrl = this;
  
  this.submitScores = function() {
    $.each(this.players, function(index, player) {
      if (player.newScore > 0) {
        PlayerScore.submitNew({'playerId' : player.id, 'score' : player.newScore},
          function() {
            PlayerScoresService.refreshPlayerScores(player.id);
            PlayerScoresService.refreshPlayerStats(player.id);
          }
        );
      }
      player.newScore = "";
    });
  }
}
ScoreEntryCtrl.$inject = ['PlayerScore', 'PlayerScoresService'];


function PlayerScoresListCtrl(PlayerScoresService) {
  var thisCtrl = this;
  
  this.getScores = function() {
    return PlayerScoresService.playerScores(this.player.id);
  }
}
PlayerScoresListCtrl.$inject = ['PlayerScoresService'];
