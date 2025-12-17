"""
URL configuration for loadtest_project project.
"""
from django.urls import path, include

urlpatterns = [
    path('heavy/', include('heavy_api.urls')),
]
