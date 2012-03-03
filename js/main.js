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

possedartsModule.factory('PlayerScoresService', ['PlayerScore', function(PlayerScore) {
  var scoresByPlayerId = {};
  
  return {
    playerScores: function(playerId) {
      return scoresByPlayerId[playerId];
    },
    refreshPlayerScores: function(playerId) {
      var scoresList = PlayerScore.list({'playerId' : playerId, 'max' : 10},
      function() {
        scoresByPlayerId[playerId] = scoresList;
      });
    }
  }
}]);

function ScoreEntryCtrl(Player, PlayerScore, PlayerScoresService) {
  var thisCtrl = this;
  
  this.players = Player.getAll({}, function() {
    $.each(thisCtrl.players, function(index, player) {
      PlayerScoresService.refreshPlayerScores(player.id);
    });
  });
  
  this.submitScores = function() {
    $.each(this.players, function(index, player) {
      if (player.newScore > 0) {
        PlayerScore.submitNew({'playerId' : player.id, 'score' : player.newScore},
          function() {
            PlayerScoresService.refreshPlayerScores(player.id)
          }
        );
      }
      player.newScore = "";
    });
  }
}
ScoreEntryCtrl.$inject = ['Player', 'PlayerScore', 'PlayerScoresService'];

function PlayerScoresListCtrl(PlayerScoresService) {
  var thisCtrl = this;
  
  this.getScores = function() {
    return PlayerScoresService.playerScores(this.player.id);
  }
}
PlayerScoresListCtrl.$inject = ['PlayerScoresService'];
