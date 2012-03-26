from google.appengine.ext import webapp
import datetime

# Really simple, insecure login
# Accepts 'secret' as part of the GET request, or as a cookie

class LoginHelper:
  SECRET = 'udon'
  
  @staticmethod
  def requestHasSecret(request):
    if 'secret' in request.cookies and request.cookies['secret'] == LoginHelper.SECRET:
      return True
    elif request.get('secret') == LoginHelper.SECRET:
      return True
    return False
  
  @staticmethod
  def responseAddSecretCookie(response):
    expireDate = datetime.datetime.now() + datetime.timedelta(days=7)
    response.headers.add_header("Set-Cookie", "secret=udon; Expires=%s" % (expireDate.strftime('%a, %d %b %Y %H:%M:%S'),))
  
