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
from peca.consts import OPCOES_MARCA, OPCOES_COR, OPCOES_TAMANHO, OPCOES_CATEGORIA
from .models import Anuncio


class ListarAnuncio(LoginRequiredMixin, ListView):
    model = Anuncio
    context_object_name = 'anuncios'
    template_name = 'anuncio/listar.html'

    def get_queryset(self):
        qs = Anuncio.objects.all().order_by('-data_criacao')
        pesquisa  = self.request.GET.get('pesquisa')
        marca     = self.request.GET.get('marca')
        cor       = self.request.GET.get('cor')
        tamanho   = self.request.GET.get('tamanho')
        categoria = self.request.GET.get('categoria')
        if pesquisa:
            qs = qs.filter(Q(titulo__icontains=pesquisa) | Q(peca__modelo__icontains=pesquisa))
        if marca:
            qs = qs.filter(peca__marca=marca)
        if cor:
            qs = qs.filter(peca__cor=cor)
        if tamanho:
            qs = qs.filter(peca__tamanho=tamanho)
        if categoria:
            qs = qs.filter(peca__categoria=categoria)
        return qs

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['opcoes_marca']     = OPCOES_MARCA
        ctx['opcoes_cor']       = OPCOES_COR
        ctx['opcoes_tamanho']   = OPCOES_TAMANHO
        ctx['opcoes_categoria'] = OPCOES_CATEGORIA
        return ctx

class CriarAnuncio(LoginRequiredMixin, CreateView):
    model = Anuncio
    form_class = FormularioAnuncio
    template_name = 'anuncio/novo.html'
    success_url = reverse_lazy('listar-anuncios')

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['usuario'] = self.request.user
        return kwargs

    def get_initial(self):
        initial = super().get_initial()
        peca_pk = self.request.GET.get('peca')
        if peca_pk:
            initial['peca'] = peca_pk
        return initial

    def form_valid(self, form):
        form.instance.usuario = self.request.user
        return super().form_valid(form)

class EditarAnuncio(LoginRequiredMixin, UpdateView):
    model = Anuncio
    form_class = FormularioAnuncio
    template_name = 'anuncio/editar.html'
    success_url = reverse_lazy('listar-anuncios')

    def get_queryset(self):
        return Anuncio.objects.filter(usuario=self.request.user)

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['usuario'] = self.request.user
        return kwargs

class ExcluirAnuncio(LoginRequiredMixin, DeleteView):
    model = Anuncio
    template_name = 'anuncio/excluir.html'
    success_url = reverse_lazy('listar-anuncios')

    def get_queryset(self):
        return Anuncio.objects.filter(usuario=self.request.user)


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
