var possedartsStatsModule = angular.module('possedarts.stats', []);

/* This seems to need to run immediately, and can't run as part of the angular "run" configuration stage. */
google.load('visualization', '1.0', {'packages':['corechart']});
/* TODO(mike): use the callback */
//google.setOnLoadCallback(function() {
//    possedartsStatsModule.value('ready', true);
//});

function GraphCtrl($scope, Player, PlayerScoresService) {

  $scope.players = Player.getAll({}, function() {
    $.each($scope.players, function(index, player) {
      PlayerScoresService.refreshPlayerData(player.id);
    });
  });

  $scope.drawChart = function(player) {
    /* TODO(mike): check google visualization API has been loaded */
    var scores = PlayerScoresService.playerScores(player.id);
    var data = new google.visualization.DataTable();
    data.addColumn('date', 'Date');
    data.addColumn('number', 'Score');
    for (var i = 0; i < scores.length; i++) {
      data.addRow([localDateFromUTC(scores[i].date), scores[i].points]);
    }

    var options = {
      'title': 'Dart throws over time',
      'hAxis': {title: 'Time'},
      'vAxis': {title: 'Score', minValue: 0, maxValue: 600},
      'width': 600,
      'height': 400};

    var chart = new google.visualization.ScatterChart(document.getElementById('chart_div'));
    chart.draw(data, options);
  }
}
GraphCtrl.$inject = ['$scope', 'Player', 'PlayerScoresService'];

