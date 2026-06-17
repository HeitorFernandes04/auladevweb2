from django.db.models import Q
from django.urls import reverse_lazy
from django.views.generic import CreateView, DeleteView, ListView, UpdateView, View
from django.contrib.auth.mixins import LoginRequiredMixin
from rest_framework.generics import CreateAPIView, DestroyAPIView, ListAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication

from anuncio.forms import FormularioAnuncio
from anuncio.serializers import SerializadorAnuncio
from peca.forms import FormularioPeca
from .models import Anuncio

class ListarAnuncio(LoginRequiredMixin, ListView):
    """
    View para listar os anúncios cadastrados.
    """
    model = Anuncio
    context_object_name = 'anuncios'
    template_name = 'anuncio/listar.html'

    def get_queryset(self, **kwargs):
        pesquisa = self.request.GET.get('pesquisa', None)
        queryset = Anuncio.objects.filter(usuario=self.request.user)
        if pesquisa is not None:
            queryset = queryset.filter(
                Q(titulo__icontains=pesquisa) | Q(peca__modelo__icontains=pesquisa)
            )
        return queryset

class CriarAnuncio(LoginRequiredMixin, CreateView):
    model = Anuncio
    form_class = FormularioAnuncio
    template_name = 'anuncio/novo.html'
    success_url = reverse_lazy('listar-anuncios')

    def form_valid(self, form):
        # Associa o anúncio ao usuário que está logado atualmente
        form.instance.usuario = self.request.user
        return super().form_valid(form)

class EditarAnuncio(LoginRequiredMixin,UpdateView):
    """
    View para editar um anúncio existente.
    """
    model = Anuncio
    form_class = FormularioAnuncio
    template_name = 'anuncio/editar.html'
    success_url = reverse_lazy('listar-anuncios')

class ExcluirAnuncio(LoginRequiredMixin, DeleteView):
    model = Anuncio
    template_name = 'anuncio/excluir.html'
    success_url = reverse_lazy('listar-anuncios')


class APIListarTodosAnuncios(ListAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = SerializadorAnuncio

    def get_queryset(self):
        return Anuncio.objects.all().order_by('-data_criacao')


class APIListarAnuncios(ListAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = SerializadorAnuncio

    def get_queryset(self):
        return Anuncio.objects.filter(usuario=self.request.user)


class APICriarAnuncio(CreateAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = SerializadorAnuncio


class APIEditarAnuncio(RetrieveUpdateAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = SerializadorAnuncio

    def get_queryset(self):
        return Anuncio.objects.filter(usuario=self.request.user)


class APIExcluirAnuncio(DestroyAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = SerializadorAnuncio

    def get_queryset(self):
        return Anuncio.objects.filter(usuario=self.request.user)
