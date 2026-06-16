from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.urls import reverse_lazy
from django.views.generic import CreateView, DeleteView, ListView, UpdateView
from peca.models import Peca
from peca.forms import FormularioPeca
from peca.consts import OPCOES_CATEGORIA
from django.contrib.auth.mixins import LoginRequiredMixin
from rest_framework.generics import DestroyAPIView, ListAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from peca.serializers import SerializadorPeca
from rest_framework.authentication import TokenAuthentication

class ListarPecas(LoginRequiredMixin, ListView):
    """
    View para listar as peças cadastradas.
    """
    model = Peca
    context_object_name = 'pecas'
    template_name = 'peca/listar.html'

    def get_queryset(self, **kwargs):
        pesquisa = self.request.GET.get('pesquisa', None)
        categoria = self.request.GET.get('categoria', None)
        queryset = Peca.objects.all()
        if pesquisa is not None:
            queryset = queryset.filter(modelo__icontains=pesquisa)
        if categoria:
            queryset = queryset.filter(categoria=categoria)
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categorias'] = OPCOES_CATEGORIA
        return context

class CriarPeca(LoginRequiredMixin,CreateView):
    """
    View para criar uma nova peça.
    """
    model = Peca
    form_class = FormularioPeca
    template_name = 'peca/novo.html'
    success_url = reverse_lazy('listar-pecas')

class EditarPeca(LoginRequiredMixin,UpdateView):
    """
    View para editar uma peça existente.
    """
    model = Peca
    form_class = FormularioPeca
    template_name = 'peca/editar.html'
    success_url = reverse_lazy('listar-pecas')

class FotoPeca(LoginRequiredMixin,ListView):
    """
    View para exibir a foto de uma peça específica.
    """

    def get(self, request, arquivo):
        """
        Método GET para retornar a foto da peça.
        """
        try:
            peca = get_object_or_404(Peca, foto=arquivo)
            return FileResponse(peca.foto)
        except Peca.DoesNotExist:
            raise Http404("Foto da peça não encontrada.")
        except Exception as exception:
            raise exception

class ExcluirPeca(LoginRequiredMixin, DeleteView):
    model = Peca
    template_name = 'peca/excluir.html'
    success_url = reverse_lazy('listar-pecas')

class APIListarPecas(ListAPIView):

    serializer_class = SerializadorPeca
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Peca.objects.all()
        categoria = self.request.query_params.get('categoria', None)
        if categoria:
            queryset = queryset.filter(categoria=categoria)
        return queryset

class APIFotoPeca(ListAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        peca = get_object_or_404(Peca, pk=pk)
        if not peca.foto:
            raise Http404("Esta peça não tem foto.")
        return FileResponse(peca.foto.open(), content_type='image/jpeg')


class APIEditarPeca(RetrieveUpdateAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = SerializadorPeca

    def get_queryset(self):
        return Peca.objects.all()

class APIExcluirPeca(DestroyAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = SerializadorPeca

    def get_queryset(self):
        return Peca.objects.all()
