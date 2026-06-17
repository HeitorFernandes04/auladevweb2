from django.forms import ModelForm
from peca.models import Peca


class FormularioPeca(ModelForm):

    class Meta:
        model = Peca
        fields = ['marca', 'modelo', 'ano', 'cor', 'tamanho', 'categoria', 'foto']
