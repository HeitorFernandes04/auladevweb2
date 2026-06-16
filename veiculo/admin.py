from django.contrib import admin
from veiculo.models import Veiculo

class VeiculoAdmin(admin.ModelAdmin):
    list_display = ('marca', 'modelo', 'ano', 'cor', 'combustivel')
    search_fields = ('modelo',)

admin.site.register(Veiculo, VeiculoAdmin)

# Register your models here.
