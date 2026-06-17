from django.db import models
from django.contrib.auth.models import User
from peca.consts import *
from datetime import date, datetime

class Peca(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    marca = models.SmallIntegerField(choices=OPCOES_MARCA)
    modelo = models.CharField(max_length=100)
    ano = models.IntegerField()
    cor = models.SmallIntegerField(choices=OPCOES_COR)
    tamanho = models.SmallIntegerField(choices=OPCOES_TAMANHO)
    categoria = models.SmallIntegerField(choices=OPCOES_CATEGORIA)
    foto = models.ImageField(blank=True, null=True, upload_to='peca/fotos/')

    def __str__(self):
        return f"{self.get_marca_display()} {self.modelo} ({self.ano})"

    def anos_de_uso(self):
        return datetime.now().year - self.ano

    @property
    def peca_nova(self):
        return self.ano == datetime.now().year
