from google.appengine.ext import db

class Score(db.Model):
  points = db.StringProperty(required=True)
  date = db.dateProperty(required=True)
  player = db.ReferenceProperty(Player, required=True)
