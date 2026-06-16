from rest_framework import serializers
from .models import Veiculo


class SerializadorVeiculo(serializers.ModelSerializer):
    """
    Serializador para o modelo Veiculo.
    """

    nome_marca = serializers.SerializerMethodField()
    nome_cor = serializers.SerializerMethodField()
    nome_combustivel = serializers.SerializerMethodField()

    class Meta:
        model = Veiculo
        exclude = []
        read_only_fields = ['nome_marca', 'nome_cor', 'nome_combustivel']
        extra_kwargs = {
            'foto': {'required': False},
        }

    def get_nome_marca(self, instancia):
        return instancia.get_marca_display()

    def get_nome_cor(self, instancia):
        return instancia.get_cor_display()

    def get_nome_combustivel(self, instancia):
        return instancia.get_combustivel_display()