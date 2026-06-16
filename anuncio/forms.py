from django import forms
from .models import Anuncio

class FormularioAnuncio(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            field.widget.attrs.update({'class': 'form-control'})
        
        # Estilização específica para o campo de descrição (mais alto)
        self.fields['descricao'].widget.attrs.update({'rows': '4'})

    class Meta:
        model = Anuncio
        # Removemos o 'usuario' do formulário para preencher via código na View
        exclude = ['usuario'] 
        labels = {
            'veiculo': 'Selecione o seu Veículo',
            'preco': 'Preço de Venda (R$)',
        }