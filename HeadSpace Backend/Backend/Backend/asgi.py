import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import chatRoom.routing


application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            chatRoom.routing.websocket_urlpatterns
        )
    ),
})
