from django.contrib.auth.models import User
from django.test import TestCase, Client
from django.urls import reverse
from peca.forms import *
from datetime import date, datetime

from peca.models import Peca

class TestesModelPeca(TestCase):
    '''
    Testes para o modelo Peca
    '''

    instancia = None

    def setUp(self):
        self.instancia = Peca(
            marca=1,
            modelo='Teste',
            ano= datetime.now().year,
            cor=1,
            tamanho=1,
            categoria=1
        )

    def test_peca_nova(self):
        self.assertTrue(self.instancia.peca_nova)
        self.instancia.ano = 2025
        self.assertFalse(self.instancia.peca_nova)

    def test_anos_de_uso(self):
        self.instancia.ano = datetime.now().year - 10
        self.assertEqual(self.instancia.anos_de_uso(), 10)

class TestesViewListarPecas(TestCase):
    '''
    Testes para a view ListarPecas
    '''

    def setUp(self):
        self.usuario = User.objects.create(username='testusuario', password='teste@123')
        self.client.force_login(self.usuario)
        self.url = reverse('listar-pecas')
        Peca(marca=1, modelo='Teste2', ano=2020, cor=2, tamanho=1, categoria=1).save()

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['pecas']), 1)

    def test_get_filtro_categoria(self):
        Peca(marca=2, modelo='Teste2b', ano=2020, cor=2, tamanho=1, categoria=2).save()
        response = self.client.get(self.url, {'categoria': 2})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['pecas']), 1)
        self.assertEqual(response.context['pecas'][0].modelo, 'Teste2b')

class TestesViewCriarPeca(TestCase):
    '''
    Testes para a view CriarPeca
    '''

    def setUp(self):
        self.usuario = User.objects.create(username='testusuario', password='teste@123')
        self.client.force_login(self.usuario)
        self.url = reverse('criar-peca')

    def test_get_autenticado(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.context['form'], FormularioPeca)

    def test_get_nao_autenticado(self):
            self.client.logout()
            response = self.client.get(self.url)
            self.assertEqual(response.status_code, 302)

    def test_post(self):
        dados = {
            'marca': 1,
            'modelo': 'Teste3',
            'ano': datetime.now().year,
            'cor': 1,
            'tamanho': 1,
            'categoria': 1
        }
        response = self.client.post(self.url, dados)

        #verificar se redirecionou certo
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('listar-pecas'))

        self.assertEqual(Peca.objects.count(), 1)
        self.assertEqual(Peca.objects.first().modelo, 'Teste3')

class TestesViewEditarPeca(TestCase):
    '''
    Testes para a view EditarPeca
    '''

    def setUp(self):
        self.instancia = Peca.objects.create(marca=1, modelo='Teste4', ano=2020, cor=2, tamanho=1, categoria=1)
        self.usuario = User.objects.create(username='testusuario', password='teste@123')
        self.client.force_login(self.usuario)
        self.url = reverse('editar-peca', kwargs={'pk': self.instancia.pk})

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.context.get('object'), Peca)
        self.assertIsInstance(response.context.get('form'), FormularioPeca)
        self.assertEqual(response.context.get('object').pk, self.instancia.pk)
        self.assertEqual(response.context.get('object').marca, 1)

    def test_post(self):
        dados = {
            'marca': 2,
            'modelo': 'Teste4',
            'ano': 2020,
            'cor': 2,
            'tamanho': 1,
            'categoria': 1
        }
        response = self.client.post(self.url, dados)
        #verificar se redirecionou certo
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('listar-pecas'))
        self.assertEqual(Peca.objects.count(),1)
        self.assertEqual(Peca.objects.first().marca, 2)
        self.assertEqual(Peca.objects.first().pk, self.instancia.pk)

class TestesViewExcluirPeca(TestCase):
    '''
    Testes para a view ExcluirPeca
    '''

    def setUp(self):
        self.instancia = Peca.objects.create(marca=1, modelo='Teste5', ano=2020, cor=2, tamanho=1, categoria=1)
        self.usuario = User.objects.create(username='testusuario', password='teste@123')
        self.client.force_login(self.usuario)
        self.url = reverse('excluir-peca', kwargs={'pk': self.instancia.pk})

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.context.get('object'), Peca)
        self.assertEqual(response.context.get('object').pk, self.instancia.pk)

    def test_post(self):
        response = self.client.post(self.url)
        #verificar se redirecionou certo
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('listar-pecas'))
        self.assertEqual(Peca.objects.count(),0)
