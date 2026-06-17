from django.urls import path
from peca.views import *

urlpatterns = [
    path('listar-peca/', ListarPecas.as_view(), name='listar-pecas'),
    path('fotos/<path:arquivo>',FotoPeca.as_view(), name='foto-peca'),
    path('editar/<int:pk>/',EditarPeca.as_view(), name='editar-peca'),
    path('novo/',CriarPeca.as_view(), name='criar-peca'),
    path('excluir/<int:pk>/',ExcluirPeca.as_view(), name='excluir-peca'),

    path('api/novo/', APICriarPeca.as_view(), name='api-criar-peca'),
    path('api/listar/', APIListarPecas.as_view(), name='api-listar-pecas'),
    path('api/foto/<int:pk>/', APIFotoPeca.as_view(), name='api-foto-peca'),
    path('api/editar/<int:pk>/', APIEditarPeca.as_view(), name='api-editar-peca'),
    path('api/excluir/<int:pk>/', APIExcluirPeca.as_view(), name='api-excluir-peca'),
]
