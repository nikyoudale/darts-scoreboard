import datetime
from google.appengine.ext import db
from Player import Player
import operator
from google.appengine.api import memcache


class ScoreType:
  Mean14Day = "Mean14Day"
  Max14Day = "Max14Day"
  
  @staticmethod
  def types():
    return [v for v in vars(ScoreType) if not v.startswith("__") and not v.startswith("types")]


class ScoresHelper:
  CACHE_EXPIRY = 86400 # 1 day
  def __init__(self, playerId):
    self._playerId = playerId
    self._scores14Days = None
  
  def get14DayScores(self, now = datetime.datetime.now()):
    if self._scores14Days is None:
      player = db.get(db.Key.from_path('Player', self._playerId))
      date14DaysAgo = now - datetime.timedelta(days=14)
      results = player.scores.filter('date >=', date14DaysAgo)
      self._scores14Days = [s.points for s in results]
    return self._scores14Days
  
  def get14DayMean(self):
    scores = self.get14DayScores()
    if len(scores) > 0:
      return round(float(sum(scores))/len(scores))
    return None
  
  def get14DayMax(self):
    scores = self.get14DayScores()
    if len(scores) > 0:
      return round(max(scores))
    return None
  
  def getScore(self, scoreType):
    if scoreType == ScoreType.Mean14Day:
      return self.get14DayMean()
    elif scoreType == ScoreType.Max14Day:
      return self.get14DayMax()
    return None
  
  def hasScores(self):
    mckey = "player-%s-has-scores" % (self._playerId,)
    has = memcache.get(mckey)
    if has is not None:
      return has
    else:
      has = len(self.get14DayScores()) > 0
      memcache.add(mckey, has, self.CACHE_EXPIRY)
    return has
  
  def clearCache(self):
    memcache.delete_multi([
      "player-%s-has-scores" % (self._playerId,),
    ])


class Rankings:
  @staticmethod
  def getRankings():
    scoresByType = {t : list() for t in ScoreType.types()}
    
    players = Player.all(keys_only=True)
    for player in players:
      playerId = player.id_or_name()
      scoresHelper = ScoresHelper(playerId)
      if scoresHelper.hasScores:
        for scoreType in ScoreType.types():
          score = scoresHelper.getScore(scoreType)
          scoresByType[scoreType].append({'playerId':playerId, 'score':score})
      
    
    # Sort scores
    for scoreType in ScoreType.types():
      scoresByType[scoreType] = sorted(scoresByType[scoreType], key=operator.itemgetter('score'), reverse=True)
    
    rankings = {}
    for scoreType in ScoreType.types():
      rank = 1
      rankings[scoreType] = {}
      for t in scoresByType[scoreType]:
        rankings[scoreType][t['playerId']] = rank
        rank += 1
    
    return rankings
  

