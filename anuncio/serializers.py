from rest_framework import serializers
from .models import Anuncio


class SerializadorAnuncio(serializers.ModelSerializer):

    nome_peca      = serializers.SerializerMethodField()
    usuario        = serializers.HiddenField(default=serializers.CurrentUserDefault())
    usuario_id     = serializers.SerializerMethodField()
    marca          = serializers.SerializerMethodField()
    nome_marca     = serializers.SerializerMethodField()
    cor            = serializers.SerializerMethodField()
    nome_cor       = serializers.SerializerMethodField()
    tamanho        = serializers.SerializerMethodField()
    nome_tamanho   = serializers.SerializerMethodField()
    categoria      = serializers.SerializerMethodField()
    nome_categoria = serializers.SerializerMethodField()

    class Meta:
        model = Anuncio
        fields = [
            'id', 'titulo', 'descricao', 'data_criacao', 'preco', 'peca',
            'nome_peca', 'usuario', 'usuario_id',
            'marca', 'nome_marca', 'cor', 'nome_cor',
            'tamanho', 'nome_tamanho', 'categoria', 'nome_categoria',
        ]
        read_only_fields = [
            'data_criacao', 'nome_peca', 'usuario_id',
            'marca', 'nome_marca', 'cor', 'nome_cor',
            'tamanho', 'nome_tamanho', 'categoria', 'nome_categoria',
        ]

    def get_nome_peca(self, instancia):
        return str(instancia.peca)

    def get_usuario_id(self, instancia):
        return instancia.usuario_id

    def get_marca(self, instancia):
        return instancia.peca.marca

    def get_nome_marca(self, instancia):
        return instancia.peca.get_marca_display()

    def get_cor(self, instancia):
        return instancia.peca.cor

    def get_nome_cor(self, instancia):
        return instancia.peca.get_cor_display()

    def get_tamanho(self, instancia):
        return instancia.peca.tamanho

    def get_nome_tamanho(self, instancia):
        return instancia.peca.get_tamanho_display()

    def get_categoria(self, instancia):
        return instancia.peca.categoria

    def get_nome_categoria(self, instancia):
        return instancia.peca.get_categoria_display()
