from django.urls import path
from veiculo.views import *

urlpatterns = [
    path('listar-veiculo/', ListarVeiculos.as_view(), name='listar-veiculos'),
    path('fotos/<path:arquivo>',FotoVeiculo.as_view(), name='foto-veiculo'),
    path('editar/<int:pk>/',EditarVeiculo.as_view(), name='editar-veiculo'),
    path('novo/',CriarVeiculo.as_view(), name='criar-veiculo'),
    path('excluir/<int:pk>/',ExcluirVeiculo.as_view(), name='excluir-veiculo'),
    
    path('api/listar/', APIListarVeiculos.as_view(), name='api-listar-veiculos'),
    path('api/foto/<int:pk>/', APIFotoVeiculo.as_view(), name='api-foto-veiculo'),
    path('api/editar/<int:pk>/', APIEditarVeiculo.as_view(), name='api-editar-veiculo'),
    path('api/excluir/<int:pk>/', APIExcluirVeiculo.as_view(), name='api-excluir-veiculo'), 
]