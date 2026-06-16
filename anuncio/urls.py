from django.urls import path
from .views import *

urlpatterns = [
    path('listar-anuncio/', ListarAnuncio.as_view(), name='listar-anuncios'),
    path('editar/<int:pk>/',EditarAnuncio.as_view(), name='editar-anuncio'),
    path('novo/',CriarAnuncio.as_view(), name='criar-anuncio'),
    path('excluir/<int:pk>/',ExcluirAnuncio.as_view(), name='excluir-anuncio')
]