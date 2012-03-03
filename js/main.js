var possedartsModule = angular.module('possedarts', []);

possedartsModule.factory('Player', ['$resource', function($resource) {
  return $resource('/api/players', {}, {
    'getAll': {method: 'GET', isArray: true}
  });
}]);

possedartsModule.factory('PlayerScore', ['$resource', function($resource) {
  return $resource('/api/scores/:action', {}, {
    'submitNew': {method: 'POST', params: {'action' : 'new'}}
  });
}]);

function ScoreEntryCtrl(Player, PlayerScore) {
  var thisCtrl = this;
  
  this.players = Player.getAll();
  
  this.submitScores = function() {
    $.each(this.players, function(index, player) {
      if (player.newScore > 0) {
        PlayerScore.submitNew({'player' : player.name, 'score' : player.newScore});
        console.log("new scrore: "+player.newScore+" for: "+player.name);
      }
      player.newScore = "";
    });
  }
}
ScoreEntryCtrl.$inject = ['Player', 'PlayerScore'];

function PlayerScoresListCtrl() {
  
}
