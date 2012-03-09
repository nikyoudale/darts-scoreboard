#!/usr/bin/env python

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext import db
import json
from Player import Player
from Score import Score
import datetime
import time
from ScoresHelper import *


class PlayersListHandler(webapp.RequestHandler):
  DEFAULT_PLAYER_NAMES = ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6"]
  def get(self):
    # Create default players if none exist
    q = db.Query(Player)
    if q.count() == 0:
      for pname in self.DEFAULT_PLAYER_NAMES: Player(name=pname).put()
    
    players = [{'name' : p.name, 'id' : p.key().id_or_name()} for p in Player.all()]
    self.response.out.write(json.dumps(players))

class NewScoreHandler(webapp.RequestHandler):
  def post(self):
    req = json.loads(self.request.body)
    score = int(req['score'])
    playerId = int(req['playerId'])
    
    player = db.Key.from_path('Player', playerId)
    
    Score(player=player, points=score).put()
    
    scoresHelper = ScoresHelper(playerId)
    scoresHelper.clearCache()

class PlayerScoreListHandler(webapp.RequestHandler):
  def get(self):
    playerId = int(self.request.get('playerId'))
    maxResults = int(self.request.get('maxScores'))
    
    player = db.get(db.Key.from_path('Player', playerId))
    
    results = player.scores.order('-date').fetch(maxResults)
    scores = [{'date' : time.mktime(s.date.timetuple()), 'points' : s.points} for s in results]
    
    stats = {}
    
    # 14 day stats
    scoresHelper = ScoresHelper(playerId)
    if scoresHelper.hasScores():
      stats['max-14-day'] = scoresHelper.get14DayMax()
      stats['mean-14-day'] = scoresHelper.get14DayMean()
    
    response = {'scores' : scores, 'stats' : stats}
    
    self.response.out.write(json.dumps(response));

class RankingsHandler(webapp.RequestHandler):
  def get(self):
    rankings = Rankings.getRankings()
    keyMappings = {ScoreType.Mean14Day : 'mean-14-day', ScoreType.Max14Day : 'max-14-day'}
    responseRankings = {}
    for scoreType in ScoreType.types():
      if keyMappings[scoreType] is not None:
        responseRankings[keyMappings[scoreType]] = rankings[scoreType]
    self.response.out.write(json.dumps(responseRankings));

def main():
  application = webapp.WSGIApplication([('/api/players', PlayersListHandler),
                                        ('/api/scores/new', NewScoreHandler),
                                        ('/api/scores/player', PlayerScoreListHandler),
                                        ('/api/scores/rankings', RankingsHandler),
                                       ],
                                       debug=True)
  util.run_wsgi_app(application)


if __name__ == '__main__':
  main()
