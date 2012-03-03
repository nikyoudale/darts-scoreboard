#!/usr/bin/env python

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
import json


class PlayersListHandler(webapp.RequestHandler):
  def get(self):
    players = [{'name': "Frank"}, {'name' : "George"}, {'name' : "John"}]
    
    self.response.out.write(json.dumps(players))

class NewScoreHandler(webapp.RequestHandler):
  def post(self):
    req = json.loads(self.request.body)
    score = req['score']
    self.response.out.write("cool:")
    self.response.out.write(score)

def main():
  application = webapp.WSGIApplication([('/api/players', PlayersListHandler),
                                        ('/api/scores/new', NewScoreHandler),
                                       ],
                                       debug=True)
  util.run_wsgi_app(application)


if __name__ == '__main__':
  main()
