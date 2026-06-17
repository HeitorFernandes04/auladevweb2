from rest_framework import serializers
from .models import Peca


class SerializadorPeca(serializers.ModelSerializer):
    """
    Serializador para o modelo Peca.
    """

    nome_marca = serializers.SerializerMethodField()
    nome_cor = serializers.SerializerMethodField()
    nome_tamanho = serializers.SerializerMethodField()
    nome_categoria = serializers.SerializerMethodField()

    class Meta:
        model = Peca
        exclude = []
        read_only_fields = ['usuario', 'nome_marca', 'nome_cor', 'nome_tamanho', 'nome_categoria']
        extra_kwargs = {
            'foto': {'required': False},
        }

    def get_nome_marca(self, instancia):
        return instancia.get_marca_display()

    def get_nome_cor(self, instancia):
        return instancia.get_cor_display()

    def get_nome_tamanho(self, instancia):
        return instancia.get_tamanho_display()

    def get_nome_categoria(self, instancia):
        return instancia.get_categoria_display()
