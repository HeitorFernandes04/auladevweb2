from django.contrib import admin
from peca.models import Peca

class PecaAdmin(admin.ModelAdmin):
    list_display = ('marca', 'modelo', 'ano', 'cor', 'tamanho', 'categoria')
    search_fields = ('modelo',)

admin.site.register(Peca, PecaAdmin)

# Register your models here.
