from django.urls import path
from . import views

urlpatterns = [
    path('cpu-io-no-db/', views.heavy_cpu_io_no_db, name='heavy_cpu_io_no_db'),
    path('health/', views.health_check, name='health_check'),
]
