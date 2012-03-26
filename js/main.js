
function MainCtrl($scope, Player, PlayerScoresService) {
  var thisCtrl = this;
  
  $scope._loading = true;
  
  $scope.players = Player.getAll({}, function() {
    $.each($scope.players, function(index, player) {
      PlayerScoresService.refreshPlayerData(player.id);
    });
    PlayerScoresService.refreshRankings();
    $scope._loading = false;
  });
  
  $scope.isPeformingRequest = function() {
    return PlayerScoresService.isLoading();
  }
}
MainCtrl.$inject = ['$scope', 'Player', 'PlayerScoresService'];


function PlayerStatsCtrl($scope, PlayerScoresService) {
  var thisCtrl = this;
  
  $scope.get14DayMax = function(player) {
    return PlayerScoresService.getPlayerStat(player.id, 'max-14-day');
  }
  
  $scope.get14DayMean = function(player) {
    return PlayerScoresService.getPlayerStat(player.id, 'mean-14-day');
  }
  
  $scope.get14DayMaxRanking = function(player) {
    return PlayerScoresService.getPlayerRanking(player.id, 'max-14-day');
  }
  
  $scope.get14DayMeanRanking = function(player) {
    return PlayerScoresService.getPlayerRanking(player.id, 'mean-14-day');
  }
}
PlayerStatsCtrl.$inject = ['$scope', 'PlayerScoresService'];


function ScoreEntryCtrl($scope, PlayerScoresService) {
  var thisCtrl = this;
  
  $scope.submitScores = function() {
    var reqCount = 0;
    $.each($scope.players, function(index, player) {
      if (player.newScore > 0) {
        reqCount++;
        PlayerScoresService.submitScore(player.id, player.newScore, function() {
          PlayerScoresService.refreshPlayerData(player.id);
          if (--reqCount == 0) {
            // Last score submit is now complete
            PlayerScoresService.refreshRankings();
          }
        });
      }
      player.newScore = "";
    });
  }
}
ScoreEntryCtrl.$inject = ['$scope', 'PlayerScoresService'];


function PlayerScoresListCtrl($scope, PlayerScoresService) {
  var thisCtrl = this;
  
  $scope.getScores = function(player) {
    return PlayerScoresService.playerScores(player.id);
  }
}
PlayerScoresListCtrl.$inject = ['$scope', 'PlayerScoresService'];
