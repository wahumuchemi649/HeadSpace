import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')

# Initialize Django ASGI application early to ensure AppRegistry is populated
# before importing routing that may import ORM models
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import chat.routing  # ← Changed from chatRoom to chat


application = ProtocolTypeRouter({
    "http": django_asgi_app,  # ← Use the variable, not calling it again
    "websocket": AuthMiddlewareStack(
        URLRouter(
            chat.routing.websocket_urlpatterns
        )
    ),
})