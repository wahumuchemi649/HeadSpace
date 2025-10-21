from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
import chatRoom.routing  # 👈 import the app-level routing

application = ProtocolTypeRouter({
    "websocket": AuthMiddlewareStack(
        URLRouter(
            chatRoom.routing.websocket_urlpatterns
        )
    ),
})
