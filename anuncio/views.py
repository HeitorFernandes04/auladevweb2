from django.urls import reverse_lazy
from django.views.generic import CreateView, DeleteView, ListView, UpdateView, View
from django.contrib.auth.mixins import LoginRequiredMixin

from anuncio.forms import FormularioAnuncio
from veiculo.forms import FormularioVeiculo
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
        queryset = Anuncio.objects.all()
        if pesquisa is not None:
            queryset = queryset.filter(modelo__icontains=pesquisa)
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