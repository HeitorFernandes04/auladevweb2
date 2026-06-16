from django.contrib.auth.models import User
from django.test import TestCase, Client
from django.urls import reverse
from veiculo.forms import *
from datetime import date, datetime

from veiculo.models import Veiculo

class TestesModelVeiculo(TestCase):
    '''
    Testes para o modelo Veiculo
    '''

    instancia = None

    def setUp(self):
        self.instancia = Veiculo(
            marca=1,
            modelo='Teste',
            ano= datetime.now().year,
            cor=1,
            combustivel=1
        )

    def test_veiculo_novo(self):
        self.assertTrue(self.instancia.veiculo_novo)
        self.instancia.ano = 2025
        self.assertFalse(self.instancia.veiculo_novo)

    def test_anos_de_uso(self):
        self.instancia.ano = datetime.now().year - 10
        self.assertEqual(self.instancia.anos_de_uso(), 10)

class TestesViewListarVeiculos(TestCase):
    '''
    Testes para a view ListarVeiculos
    '''

    def setUp(self):
        self.usuario = User.objects.create(username='testusuario', password='teste@123')
        self.client.force_login(self.usuario)
        self.url = reverse('listar-veiculos')
        Veiculo(marca=1, modelo='Teste2', ano=2020, cor=2, combustivel=1).save()

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['veiculos']), 1)
    
class TestesViewCriarVeiculo(TestCase):
    '''
    Testes para a view CriarVeiculo
    '''

    def setUp(self):
        self.usuario = User.objects.create(username='testusuario', password='teste@123')
        self.client.force_login(self.usuario)
        self.url = reverse('criar-veiculo')

    def test_get_autenticado(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.context['form'], FormularioVeiculo)
    
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
            'combustivel': 1
        }
        response = self.client.post(self.url, dados)

        #verificar se redirecionou certo
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('listar-veiculos'))

        self.assertEqual(Veiculo.objects.count(), 1)
        self.assertEqual(Veiculo.objects.first().modelo, 'Teste3')

class TestesViewEditarVeiculo(TestCase):
    '''
    Testes para a view EditarVeiculo
    '''

    def setUp(self):
        self.instancia = Veiculo.objects.create(marca=1, modelo='Teste4', ano=2020, cor=2, combustivel=1)
        self.usuario = User.objects.create(username='testusuario', password='teste@123')
        self.client.force_login(self.usuario)
        self.url = reverse('editar-veiculo', kwargs={'pk': self.instancia.pk})

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.context.get('object'), Veiculo)
        self.assertIsInstance(response.context.get('form'), FormularioVeiculo)
        self.assertEqual(response.context.get('object').pk, self.instancia.pk)
        self.assertEqual(response.context.get('object').marca, 1)

    def test_post(self):
        dados = {
            'marca': 2,
            'modelo': 'Teste4',
            'ano': 2020,
            'cor': 2,
            'combustivel': 1
        }
        response = self.client.post(self.url, dados)
        #verificar se redirecionou certo
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('listar-veiculos'))
        self.assertEqual(Veiculo.objects.count(),1)
        self.assertEqual(Veiculo.objects.first().marca, 2)
        self.assertEqual(Veiculo.objects.first().pk, self.instancia.pk)

class TestesViewExcluirVeiculo(TestCase):
    '''
    Testes para a view ExcluirVeiculo
    '''
    
    def setUp(self):
        self.instancia = Veiculo.objects.create(marca=1, modelo='Teste5', ano=2020, cor=2, combustivel=1)
        self.usuario = User.objects.create(username='testusuario', password='teste@123')
        self.client.force_login(self.usuario)
        self.url = reverse('excluir-veiculo', kwargs={'pk': self.instancia.pk})

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.context.get('object'), Veiculo)
        self.assertEqual(response.context.get('object').pk, self.instancia.pk)
        
    def test_post(self):
        response = self.client.post(self.url)
        #verificar se redirecionou certo
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('listar-veiculos'))
        self.assertEqual(Veiculo.objects.count(),0)


        