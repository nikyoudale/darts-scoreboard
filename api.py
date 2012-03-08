#!/usr/bin/env python

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext import db
import json
from Player import Player
from Score import Score
import datetime
import time


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

class PlayerScoreListHandler(webapp.RequestHandler):
  def get(self):
    playerId = int(self.request.get('playerId'))
    maxResults = int(self.request.get('maxScores'))
    
    player = db.get(db.Key.from_path('Player', playerId))
    
    results = player.scores.order('-date').fetch(maxResults)
    scores = [{'date' : time.mktime(s.date.timetuple()), 'points' : s.points} for s in results]
    
    stats = {}
    
    # 14 day stats
    date14DaysAgo = datetime.datetime.now() - datetime.timedelta(days=14)
    results = player.scores.filter('date >=', date14DaysAgo)
    scores14Days = [s.points for s in results]
    if len(scores14Days) > 0:
      stats['max-14-day'] = round(max(scores14Days))
      stats['mean-14-day'] = round(float(sum(scores14Days))/len(scores14Days))
    
    
    response = {'scores' : scores, 'stats' : stats}
    
    self.response.out.write(json.dumps(response));

def main():
  application = webapp.WSGIApplication([('/api/players', PlayersListHandler),
                                        ('/api/scores/new', NewScoreHandler),
                                        ('/api/scores/player', PlayerScoreListHandler),
                                       ],
                                       debug=True)
  util.run_wsgi_app(application)


if __name__ == '__main__':
  main()
