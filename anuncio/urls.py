from django.urls import path
from .views import *

urlpatterns = [
    path('listar-anuncio/', ListarAnuncio.as_view(), name='listar-anuncios'),
    path('editar/<int:pk>/', EditarAnuncio.as_view(), name='editar-anuncio'),
    path('novo/', CriarAnuncio.as_view(), name='criar-anuncio'),
    path('excluir/<int:pk>/', ExcluirAnuncio.as_view(), name='excluir-anuncio'),

    path('api/listar/', APIListarAnuncios.as_view(), name='api-listar-anuncios'),
    path('api/novo/', APICriarAnuncio.as_view(), name='api-criar-anuncio'),
    path('api/editar/<int:pk>/', APIEditarAnuncio.as_view(), name='api-editar-anuncio'),
    path('api/excluir/<int:pk>/', APIExcluirAnuncio.as_view(), name='api-excluir-anuncio'),
]