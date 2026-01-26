
from django.contrib import admin
from django.urls import path,include
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('',include('therapy.urls')),
    path('api/',include('patients.urls')),
    path('',include('consultation.urls')),
    path('chat/',include('chat.urls'))
]
    


if settings.DEBUG:  # only serve media in development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
