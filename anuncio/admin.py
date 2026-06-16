from django.contrib import admin
from anuncio.models import Anuncio

class AnuncioAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'descricao', 'preco', 'veiculo', 'usuario')
    search_fields = ('titulo', 'descricao')

admin.site.register(Anuncio, AnuncioAdmin)

# Register your models here.
