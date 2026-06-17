from rest_framework import serializers
from .models import Anuncio


class SerializadorAnuncio(serializers.ModelSerializer):

    nome_peca = serializers.SerializerMethodField()
    usuario = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Anuncio
        fields = ['id', 'titulo', 'descricao', 'data_criacao', 'preco', 'peca', 'nome_peca', 'usuario']
        read_only_fields = ['data_criacao', 'nome_peca']

    def get_nome_peca(self, instancia):
        return str(instancia.peca)
