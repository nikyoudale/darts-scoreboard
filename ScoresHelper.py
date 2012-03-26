import datetime
from google.appengine.ext import db
from Player import Player
import operator
from google.appengine.api import memcache


class ScoreType:
  Mean14Day = "Mean14Day"
  Max14Day = "Max14Day"
  Count14Day = "Count14Day"
  
  @staticmethod
  def types():
    return [v for v in vars(ScoreType) if not v.startswith("__") and not v.startswith("types")]


class ScoresHelper:
  CACHE_EXPIRY = 43200 # 12 hours
  MIN_SCORE_COUNTS = {
    ScoreType.Mean14Day : 10,
    ScoreType.Max14Day : 1,
  }
  
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
  
  def count14DayScores(self, now = datetime.datetime.now()):
    mckey = "player-%s-14-day-count" % (self._playerId,)
    count = memcache.get(mckey)
    if count is None:
      count = len(self.get14DayScores())
      memcache.add(mckey, count, self.CACHE_EXPIRY)
    return count
  
  def get14DayMean(self):
    score = None
    if self.count14DayScores() >= self.MIN_SCORE_COUNTS[ScoreType.Mean14Day]:
      mckey = "player-%s-14-day-mean" % (self._playerId,)
      score = memcache.get(mckey)
      if score is None:
        scores = self.get14DayScores()
        if len(scores) > 0:
          score = round(float(sum(scores))/len(scores))
          memcache.add(mckey, score, self.CACHE_EXPIRY)
    return score
  
  def get14DayMax(self):
    score = None
    if self.count14DayScores() >= self.MIN_SCORE_COUNTS[ScoreType.Max14Day]:
      mckey = "player-%s-14-day-max" % (self._playerId,)
      score = memcache.get(mckey)
      if score is None:
        scores = self.get14DayScores()
        if len(scores) > 0:
          score = round(max(scores))
          memcache.add(mckey, score, self.CACHE_EXPIRY)
    return score
  
  def getScore(self, scoreType):
    if scoreType == ScoreType.Mean14Day:
      return self.get14DayMean()
    elif scoreType == ScoreType.Max14Day:
      return self.get14DayMax()
    elif scoreType == ScoreType.Count14Day:
      return self.count14DayScores()
    return None
  
  def hasScores(self):
    return self.count14DayScores() > 0
  
  def clearCache(self):
    memcache.delete_multi([
      "player-%s-14-day-count" % (self._playerId,),
      "player-%s-14-day-mean" % (self._playerId,),
      "player-%s-14-day-max" % (self._playerId,),
    ])


class Rankings:
  @staticmethod
  def getRankings():
    scoresByType = {t : list() for t in ScoreType.types()}
    
    players = Player.all(keys_only=True)
    for player in players:
      playerId = player.id_or_name()
      scoresHelper = ScoresHelper(playerId)
      if scoresHelper.hasScores():
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
  

