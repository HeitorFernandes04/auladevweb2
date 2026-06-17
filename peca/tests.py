from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from datetime import datetime

from peca.forms import FormularioPeca
from peca.models import Peca


class TestesModelPeca(TestCase):

    def setUp(self):
        self.instancia = Peca(
            marca=1,
            modelo='Teste',
            ano=datetime.now().year,
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

    def setUp(self):
        self.usuario = User.objects.create_user(username='testusuario', password='teste@123')
        self.client.force_login(self.usuario)
        self.url = reverse('listar-pecas')
        Peca.objects.create(usuario=self.usuario, marca=1, modelo='Teste2', ano=2020, cor=2, tamanho=1, categoria=1)

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['pecas']), 1)

    def test_get_filtro_categoria(self):
        Peca.objects.create(usuario=self.usuario, marca=2, modelo='Teste2b', ano=2020, cor=2, tamanho=1, categoria=2)
        response = self.client.get(self.url, {'categoria': 2})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['pecas']), 1)
        self.assertEqual(response.context['pecas'][0].modelo, 'Teste2b')

    def test_isolamento(self):
        outro_usuario = User.objects.create_user(username='outro', password='teste@123')
        Peca.objects.create(usuario=outro_usuario, marca=1, modelo='PecaOutro', ano=2020, cor=1, tamanho=1, categoria=1)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['pecas']), 1)


class TestesViewCriarPeca(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(username='testusuario', password='teste@123')
        self.client.force_login(self.usuario)
        self.url = reverse('criar-peca')

    def test_get_autenticado(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.context['form'], FormularioPeca)

    def test_get_nao_autenticado(self):
        self.client.logout()
        response = self.client.get(self.url)
        self.assertRedirects(response, f"{reverse('login')}?next={self.url}")

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
        self.assertRedirects(response, reverse('listar-pecas'))
        self.assertEqual(Peca.objects.count(), 1)
        self.assertEqual(Peca.objects.first().modelo, 'Teste3')
        self.assertEqual(Peca.objects.first().usuario, self.usuario)


class TestesViewEditarPeca(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(username='testusuario', password='teste@123')
        self.client.force_login(self.usuario)
        self.instancia = Peca.objects.create(usuario=self.usuario, marca=1, modelo='Teste4', ano=2020, cor=2, tamanho=1, categoria=1)
        self.url = reverse('editar-peca', kwargs={'pk': self.instancia.pk})

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.context.get('form'), FormularioPeca)
        self.assertIsInstance(response.context.get('object'), Peca)
        self.assertEqual(response.context.get('object').pk, self.instancia.pk)
        self.assertEqual(response.context.get('object').marca, 1)

    def test_post(self):
        dados = {'marca': 2, 'modelo': 'Teste4', 'ano': 2020, 'cor': 2, 'tamanho': 1, 'categoria': 1}
        response = self.client.post(self.url, dados)
        self.assertRedirects(response, reverse('listar-pecas'))
        self.assertEqual(Peca.objects.count(), 1)
        self.assertEqual(Peca.objects.first().marca, 2)
        self.assertEqual(Peca.objects.first().pk, self.instancia.pk)

    def test_get_peca_alheia(self):
        outro_usuario = User.objects.create_user(username='outro', password='teste@123')
        peca_alheia = Peca.objects.create(usuario=outro_usuario, marca=1, modelo='Alheia', ano=2020, cor=1, tamanho=1, categoria=1)
        url_alheia = reverse('editar-peca', kwargs={'pk': peca_alheia.pk})
        response = self.client.get(url_alheia)
        self.assertEqual(response.status_code, 404)


class TestesViewExcluirPeca(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(username='testusuario', password='teste@123')
        self.client.force_login(self.usuario)
        self.instancia = Peca.objects.create(usuario=self.usuario, marca=1, modelo='Teste5', ano=2020, cor=2, tamanho=1, categoria=1)
        self.url = reverse('excluir-peca', kwargs={'pk': self.instancia.pk})

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.context.get('object'), Peca)
        self.assertEqual(response.context.get('object').pk, self.instancia.pk)

    def test_post(self):
        response = self.client.post(self.url)
        self.assertRedirects(response, reverse('listar-pecas'))
        self.assertEqual(Peca.objects.count(), 0)

    def test_post_peca_alheia(self):
        outro_usuario = User.objects.create_user(username='outro', password='teste@123')
        peca_alheia = Peca.objects.create(usuario=outro_usuario, marca=1, modelo='Alheia', ano=2020, cor=1, tamanho=1, categoria=1)
        url_alheia = reverse('excluir-peca', kwargs={'pk': peca_alheia.pk})
        response = self.client.post(url_alheia)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Peca.objects.count(), 2)


class TestesAPICriarPeca(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(username='testusuario', password='teste@123')
        self.token = Token.objects.create(user=self.usuario)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        self.url = reverse('api-criar-peca')

    def test_post(self):
        dados = {'marca': 1, 'modelo': 'APITeste', 'ano': datetime.now().year, 'cor': 1, 'tamanho': 1, 'categoria': 1}
        response = self.client.post(self.url, dados, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Peca.objects.count(), 1)
        self.assertEqual(response.data['modelo'], 'APITeste')
        self.assertEqual(Peca.objects.first().usuario, self.usuario)

    def test_post_sem_token(self):
        client_sem_token = APIClient()
        dados = {'marca': 1, 'modelo': 'APITeste', 'ano': datetime.now().year, 'cor': 1, 'tamanho': 1, 'categoria': 1}
        response = client_sem_token.post(self.url, dados, format='json')
        self.assertEqual(response.status_code, 401)


class TestesAPIListarPecas(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(username='testusuario', password='teste@123')
        self.token = Token.objects.create(user=self.usuario)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        self.url = reverse('api-listar-pecas')
        Peca.objects.create(usuario=self.usuario, marca=1, modelo='APIPeca', ano=2020, cor=1, tamanho=1, categoria=1)

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['modelo'], 'APIPeca')

    def test_isolamento(self):
        outro_usuario = User.objects.create_user(username='outro', password='teste@123')
        Peca.objects.create(usuario=outro_usuario, marca=1, modelo='PecaOutro', ano=2020, cor=1, tamanho=1, categoria=1)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_get_sem_token(self):
        client_sem_token = APIClient()
        response = client_sem_token.get(self.url)
        self.assertEqual(response.status_code, 401)


class TestesAPIEditarPeca(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(username='testusuario', password='teste@123')
        self.token = Token.objects.create(user=self.usuario)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        self.peca = Peca.objects.create(usuario=self.usuario, marca=1, modelo='APIEditar', ano=2020, cor=1, tamanho=1, categoria=1)
        self.url = reverse('api-editar-peca', kwargs={'pk': self.peca.pk})

    def test_patch(self):
        response = self.client.patch(self.url, {'modelo': 'APIEditado'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['modelo'], 'APIEditado')
        self.assertEqual(Peca.objects.first().modelo, 'APIEditado')

    def test_patch_peca_alheia(self):
        outro_usuario = User.objects.create_user(username='outro', password='teste@123')
        peca_alheia = Peca.objects.create(usuario=outro_usuario, marca=1, modelo='Alheia', ano=2020, cor=1, tamanho=1, categoria=1)
        url_alheia = reverse('api-editar-peca', kwargs={'pk': peca_alheia.pk})
        response = self.client.patch(url_alheia, {'modelo': 'Hackeado'}, format='json')
        self.assertEqual(response.status_code, 404)

    def test_patch_sem_token(self):
        client_sem_token = APIClient()
        response = client_sem_token.patch(self.url, {'modelo': 'Hackeado'}, format='json')
        self.assertEqual(response.status_code, 401)


class TestesAPIExcluirPeca(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(username='testusuario', password='teste@123')
        self.token = Token.objects.create(user=self.usuario)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        self.peca = Peca.objects.create(usuario=self.usuario, marca=1, modelo='APIExcluir', ano=2020, cor=1, tamanho=1, categoria=1)
        self.url = reverse('api-excluir-peca', kwargs={'pk': self.peca.pk})

    def test_delete(self):
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Peca.objects.count(), 0)

    def test_delete_peca_alheia(self):
        outro_usuario = User.objects.create_user(username='outro', password='teste@123')
        peca_alheia = Peca.objects.create(usuario=outro_usuario, marca=1, modelo='Alheia', ano=2020, cor=1, tamanho=1, categoria=1)
        url_alheia = reverse('api-excluir-peca', kwargs={'pk': peca_alheia.pk})
        response = self.client.delete(url_alheia)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Peca.objects.count(), 2)

    def test_delete_sem_token(self):
        client_sem_token = APIClient()
        response = client_sem_token.delete(self.url)
        self.assertEqual(response.status_code, 401)
