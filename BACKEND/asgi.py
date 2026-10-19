import os
import sys
from pathlib import Path

# Ensure both BACKEND and its parent directory (Headspace) are in sys.path
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent

for p in (str(PROJECT_ROOT), str(CURRENT_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

# Alias casing variants so imports (BACKEND, Backend, backend) always resolve
try:
    import BACKEND
    sys.modules.setdefault('Backend', BACKEND)
    sys.modules.setdefault('backend', BACKEND)
except ImportError:
    pass

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BACKEND.settings')

# Initialize Django ASGI application early to ensure AppRegistry is populated
# before importing routing that may import ORM models
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import chat.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            chat.routing.websocket_urlpatterns
        )
    ),
})