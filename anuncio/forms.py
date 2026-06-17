from django import forms
from .models import Anuncio
from peca.models import Peca

class FormularioAnuncio(forms.ModelForm):
    def __init__(self, *args, usuario=None, **kwargs):
        super().__init__(*args, **kwargs)
        if usuario is not None:
            self.fields['peca'].queryset = Peca.objects.filter(usuario=usuario)
        for field_name, field in self.fields.items():
            field.widget.attrs.update({'class': 'form-control'})

        # Estilização específica para o campo de descrição (mais alto)
        self.fields['descricao'].widget.attrs.update({'rows': '4'})

    class Meta:
        model = Anuncio
        # Removemos o 'usuario' do formulário para preencher via código na View
        exclude = ['usuario']
        labels = {
            'peca': 'Selecione a sua Peça',
            'preco': 'Preço de Venda (R$)',
        }
