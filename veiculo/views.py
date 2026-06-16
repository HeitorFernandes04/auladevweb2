from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.urls import reverse_lazy
from django.views.generic import CreateView, DeleteView, ListView, UpdateView
from veiculo.models import Veiculo
from veiculo.forms import FormularioVeiculo
from django.contrib.auth.mixins import LoginRequiredMixin
from rest_framework.generics import DestroyAPIView, ListAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from veiculo.serializers import SerializadorVeiculo
from rest_framework.authentication import TokenAuthentication  

class ListarVeiculos(LoginRequiredMixin, ListView):
    """
    View para listar os veículos cadastrados.
    """
    model = Veiculo
    context_object_name = 'veiculos'
    template_name = 'veiculo/listar.html'

    def get_queryset(self, **kwargs):
        pesquisa = self.request.GET.get('pesquisa', None)
        queryset = Veiculo.objects.all()
        if pesquisa is not None:
            queryset = queryset.filter(modelo__icontains=pesquisa)
        return queryset
    
class CriarVeiculo(LoginRequiredMixin,CreateView):
    """
    View para criar um novo veículo.
    """
    model = Veiculo
    form_class = FormularioVeiculo
    template_name = 'veiculo/novo.html'
    success_url = reverse_lazy('listar-veiculos')

class EditarVeiculo(LoginRequiredMixin,UpdateView):
    """
    View para editar um veículo existente.
    """
    model = Veiculo
    form_class = FormularioVeiculo
    template_name = 'veiculo/editar.html'
    success_url = reverse_lazy('listar-veiculos')

class FotoVeiculo(LoginRequiredMixin,ListView):
    """
    View para exibir a foto de um veículo específico.
    """

    def get(self, request, arquivo):
        """
        Método GET para retornar a foto do veículo.
        """
        try:
            veiculo = get_object_or_404(Veiculo, foto=arquivo)
            return FileResponse(veiculo.foto)
        except Veiculo.DoesNotExist:
            raise Http404("Foto do veículo não encontrada.")
        except Exception as exception:
            raise exception
        
class ExcluirVeiculo(LoginRequiredMixin, DeleteView):
    model = Veiculo
    template_name = 'veiculo/excluir.html' 
    success_url = reverse_lazy('listar-veiculos')

class APIListarVeiculos(ListAPIView):

    serializer_class = SerializadorVeiculo
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Veiculo.objects.all()

class APIFotoVeiculo(ListAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        veiculo = get_object_or_404(Veiculo, pk=pk)
        if not veiculo.foto:
            raise Http404("Este veículo não tem foto.")
        return FileResponse(veiculo.foto.open(), content_type='image/jpeg')
    

class APIEditarVeiculo(RetrieveUpdateAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = SerializadorVeiculo

    def get_queryset(self):
        return Veiculo.objects.all()

class APIExcluirVeiculo(DestroyAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = SerializadorVeiculo

    def get_queryset(self):
        return Veiculo.objects.all()