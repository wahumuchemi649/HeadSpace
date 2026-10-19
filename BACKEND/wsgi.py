"""
WSGI config for BACKEND project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

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

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BACKEND.settings')

application = get_wsgi_application()
