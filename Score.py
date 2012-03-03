from google.appengine.ext import db
from Player import Player

class Score(db.Model):
  points = db.IntegerProperty(required=True)
  date = db.DateTimeProperty(required=True, auto_now=True)
  player = db.ReferenceProperty(Player, required=True, collection_name='scores')
