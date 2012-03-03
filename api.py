#!/usr/bin/env python

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext import db
import json
from Player import Player
from Score import Score
import datetime


class PlayersListHandler(webapp.RequestHandler):
  DEFAULT_PLAYER_NAMES = ["Bill", "Tom", "George"]
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
    maxResults = int(self.request.get('max'))
    
    player = db.get(db.Key.from_path('Player', playerId))
    
    results = player.scores.order('-date').fetch(maxResults)
    scores = [{'date' : s.date.isoformat(), 'points' : s.points} for s in results]
    
    self.response.out.write(json.dumps(scores));

def main():
  application = webapp.WSGIApplication([('/api/players', PlayersListHandler),
                                        ('/api/scores/new', NewScoreHandler),
                                        ('/api/scores/player', PlayerScoreListHandler),
                                       ],
                                       debug=True)
  util.run_wsgi_app(application)


if __name__ == '__main__':
  main()
