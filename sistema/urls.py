from django.contrib import admin
from django.urls import include, path
from sistema.views import Login, LoginAPI, Logout

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', Login.as_view(), name='login'),
    path('logout/', Logout.as_view(), name='logout'),
    path('veiculo/', include('veiculo.urls'), name = 'veiculo'),
    path('anuncio/', include('anuncio.urls'), name = 'anuncio'),
    path('api/autenticacao-api/', LoginAPI.as_view(), name='autenticacao-api'),
]