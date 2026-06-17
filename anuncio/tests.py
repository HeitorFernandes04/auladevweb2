from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

from anuncio.forms import FormularioAnuncio
from anuncio.models import Anuncio
from peca.models import Peca


class TestesModelAnuncio(TestCase):

    def setUp(self):
        self.instancia = Anuncio(titulo='Jaqueta Linda', descricao='Ótimo estado', preco=99.99)

    def test_str(self):
        self.assertEqual(str(self.instancia), 'Jaqueta Linda')


class TestesViewListarAnuncio(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(username='testusuario', password='teste@123')
        self.client.force_login(self.usuario)
        self.url = reverse('listar-anuncios')
        self.peca = Peca.objects.create(usuario=self.usuario, marca=1, modelo='ModeloTeste', ano=2020, cor=1, tamanho=1, categoria=1)
        self.anuncio = Anuncio.objects.create(usuario=self.usuario, peca=self.peca, titulo='Titulo Teste', descricao='Desc', preco=99.99)

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['anuncios']), 1)

    def test_get_filtro_pesquisa(self):
        peca2 = Peca.objects.create(usuario=self.usuario, marca=2, modelo='Modelo2', ano=2020, cor=1, tamanho=1, categoria=1)
        Anuncio.objects.create(usuario=self.usuario, peca=peca2, titulo='Outro Anuncio', descricao='Desc', preco=50.00)
        response = self.client.get(self.url, {'pesquisa': 'Titulo Teste'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['anuncios']), 1)
        self.assertEqual(response.context['anuncios'][0].titulo, 'Titulo Teste')

    def test_get_filtro_marca(self):
        peca2 = Peca.objects.create(usuario=self.usuario, marca=2, modelo='Modelo2', ano=2020, cor=1, tamanho=1, categoria=1)
        Anuncio.objects.create(usuario=self.usuario, peca=peca2, titulo='Anuncio Marca 2', descricao='Desc', preco=50.00)
        response = self.client.get(self.url, {'marca': 1})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['anuncios']), 1)
        self.assertEqual(response.context['anuncios'][0].titulo, 'Titulo Teste')

    def test_get_filtro_categoria(self):
        peca2 = Peca.objects.create(usuario=self.usuario, marca=1, modelo='Modelo2', ano=2020, cor=1, tamanho=1, categoria=2)
        Anuncio.objects.create(usuario=self.usuario, peca=peca2, titulo='Anuncio Categoria 2', descricao='Desc', preco=50.00)
        response = self.client.get(self.url, {'categoria': 1})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['anuncios']), 1)
        self.assertEqual(response.context['anuncios'][0].titulo, 'Titulo Teste')

    def test_get_nao_autenticado(self):
        self.client.logout()
        response = self.client.get(self.url)
        self.assertRedirects(response, f"{reverse('login')}?next={self.url}")


class TestesViewCriarAnuncio(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(username='testusuario', password='teste@123')
        self.client.force_login(self.usuario)
        self.url = reverse('criar-anuncio')
        self.peca = Peca.objects.create(usuario=self.usuario, marca=1, modelo='ModeloTeste', ano=2020, cor=1, tamanho=1, categoria=1)

    def test_get_autenticado(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.context['form'], FormularioAnuncio)

    def test_get_nao_autenticado(self):
        self.client.logout()
        response = self.client.get(self.url)
        self.assertRedirects(response, f"{reverse('login')}?next={self.url}")

    def test_get_peca_preseleciona(self):
        response = self.client.get(self.url, {'peca': self.peca.pk})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context['form'].initial['peca'], str(self.peca.pk))

    def test_form_so_mostra_pecas_do_usuario(self):
        outro_usuario = User.objects.create_user(username='outro', password='teste@123')
        peca_alheia = Peca.objects.create(usuario=outro_usuario, marca=1, modelo='Alheia', ano=2020, cor=1, tamanho=1, categoria=1)
        response = self.client.get(self.url)
        queryset = response.context['form'].fields['peca'].queryset
        self.assertIn(self.peca, queryset)
        self.assertNotIn(peca_alheia, queryset)

    def test_post(self):
        dados = {'peca': self.peca.pk, 'titulo': 'Anuncio Teste', 'descricao': 'Desc', 'preco': '99.99'}
        response = self.client.post(self.url, dados)
        self.assertRedirects(response, reverse('listar-anuncios'))
        self.assertEqual(Anuncio.objects.count(), 1)
        anuncio = Anuncio.objects.first()
        self.assertEqual(anuncio.titulo, 'Anuncio Teste')
        self.assertEqual(anuncio.usuario, self.usuario)
        self.assertEqual(anuncio.peca, self.peca)


class TestesViewEditarAnuncio(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(username='testusuario', password='teste@123')
        self.client.force_login(self.usuario)
        self.peca = Peca.objects.create(usuario=self.usuario, marca=1, modelo='ModeloTeste', ano=2020, cor=1, tamanho=1, categoria=1)
        self.instancia = Anuncio.objects.create(usuario=self.usuario, peca=self.peca, titulo='Titulo Teste', descricao='Desc', preco=99.99)
        self.url = reverse('editar-anuncio', kwargs={'pk': self.instancia.pk})

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.context.get('form'), FormularioAnuncio)
        self.assertIsInstance(response.context.get('object'), Anuncio)
        self.assertEqual(response.context.get('object').pk, self.instancia.pk)

    def test_post(self):
        dados = {'peca': self.peca.pk, 'titulo': 'Titulo Editado', 'descricao': 'Desc', 'preco': '199.99'}
        response = self.client.post(self.url, dados)
        self.assertRedirects(response, reverse('listar-anuncios'))
        self.assertEqual(Anuncio.objects.count(), 1)
        self.assertEqual(Anuncio.objects.first().titulo, 'Titulo Editado')
        self.assertEqual(Anuncio.objects.first().pk, self.instancia.pk)

    def test_get_anuncio_alheio(self):
        outro_usuario = User.objects.create_user(username='outro', password='teste@123')
        peca_alheia = Peca.objects.create(usuario=outro_usuario, marca=1, modelo='Alheia', ano=2020, cor=1, tamanho=1, categoria=1)
        anuncio_alheio = Anuncio.objects.create(usuario=outro_usuario, peca=peca_alheia, titulo='Alheio', descricao='Desc', preco=50.00)
        url_alheia = reverse('editar-anuncio', kwargs={'pk': anuncio_alheio.pk})
        response = self.client.get(url_alheia)
        self.assertEqual(response.status_code, 404)


class TestesViewExcluirAnuncio(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(username='testusuario', password='teste@123')
        self.client.force_login(self.usuario)
        self.peca = Peca.objects.create(usuario=self.usuario, marca=1, modelo='ModeloTeste', ano=2020, cor=1, tamanho=1, categoria=1)
        self.instancia = Anuncio.objects.create(usuario=self.usuario, peca=self.peca, titulo='Titulo Teste', descricao='Desc', preco=99.99)
        self.url = reverse('excluir-anuncio', kwargs={'pk': self.instancia.pk})

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.context.get('object'), Anuncio)
        self.assertEqual(response.context.get('object').pk, self.instancia.pk)

    def test_post(self):
        response = self.client.post(self.url)
        self.assertRedirects(response, reverse('listar-anuncios'))
        self.assertEqual(Anuncio.objects.count(), 0)

    def test_post_anuncio_alheio(self):
        outro_usuario = User.objects.create_user(username='outro', password='teste@123')
        peca_alheia = Peca.objects.create(usuario=outro_usuario, marca=1, modelo='Alheia', ano=2020, cor=1, tamanho=1, categoria=1)
        anuncio_alheio = Anuncio.objects.create(usuario=outro_usuario, peca=peca_alheia, titulo='Alheio', descricao='Desc', preco=50.00)
        url_alheia = reverse('excluir-anuncio', kwargs={'pk': anuncio_alheio.pk})
        response = self.client.post(url_alheia)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Anuncio.objects.count(), 2)


class TestesAPICriarAnuncio(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(username='testusuario', password='teste@123')
        self.token = Token.objects.create(user=self.usuario)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        self.url = reverse('api-criar-anuncio')
        self.peca = Peca.objects.create(usuario=self.usuario, marca=1, modelo='ModeloTeste', ano=2020, cor=1, tamanho=1, categoria=1)

    def test_post(self):
        dados = {'peca': self.peca.pk, 'titulo': 'API Anuncio', 'descricao': 'Desc', 'preco': '99.99'}
        response = self.client.post(self.url, dados, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Anuncio.objects.count(), 1)
        self.assertEqual(response.data['titulo'], 'API Anuncio')
        self.assertEqual(Anuncio.objects.first().usuario, self.usuario)

    def test_post_sem_token(self):
        client_sem_token = APIClient()
        dados = {'peca': self.peca.pk, 'titulo': 'API Anuncio', 'descricao': 'Desc', 'preco': '99.99'}
        response = client_sem_token.post(self.url, dados, format='json')
        self.assertEqual(response.status_code, 401)


class TestesAPIListarAnuncios(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(username='testusuario', password='teste@123')
        self.token = Token.objects.create(user=self.usuario)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        self.url = reverse('api-listar-anuncios')
        self.peca = Peca.objects.create(usuario=self.usuario, marca=1, modelo='ModeloTeste', ano=2020, cor=1, tamanho=1, categoria=1)
        Anuncio.objects.create(usuario=self.usuario, peca=self.peca, titulo='Meu Anuncio', descricao='Desc', preco=99.99)

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['titulo'], 'Meu Anuncio')

    def test_isolamento(self):
        outro_usuario = User.objects.create_user(username='outro', password='teste@123')
        peca_alheia = Peca.objects.create(usuario=outro_usuario, marca=1, modelo='Alheia', ano=2020, cor=1, tamanho=1, categoria=1)
        Anuncio.objects.create(usuario=outro_usuario, peca=peca_alheia, titulo='Anuncio Outro', descricao='Desc', preco=50.00)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_get_sem_token(self):
        client_sem_token = APIClient()
        response = client_sem_token.get(self.url)
        self.assertEqual(response.status_code, 401)


class TestesAPIEditarAnuncio(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(username='testusuario', password='teste@123')
        self.token = Token.objects.create(user=self.usuario)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        self.peca = Peca.objects.create(usuario=self.usuario, marca=1, modelo='ModeloTeste', ano=2020, cor=1, tamanho=1, categoria=1)
        self.anuncio = Anuncio.objects.create(usuario=self.usuario, peca=self.peca, titulo='Titulo Original', descricao='Desc', preco=99.99)
        self.url = reverse('api-editar-anuncio', kwargs={'pk': self.anuncio.pk})

    def test_patch(self):
        response = self.client.patch(self.url, {'titulo': 'Titulo Editado'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['titulo'], 'Titulo Editado')
        self.assertEqual(Anuncio.objects.first().titulo, 'Titulo Editado')

    def test_patch_anuncio_alheio(self):
        outro_usuario = User.objects.create_user(username='outro', password='teste@123')
        peca_alheia = Peca.objects.create(usuario=outro_usuario, marca=1, modelo='Alheia', ano=2020, cor=1, tamanho=1, categoria=1)
        anuncio_alheio = Anuncio.objects.create(usuario=outro_usuario, peca=peca_alheia, titulo='Alheio', descricao='Desc', preco=50.00)
        url_alheia = reverse('api-editar-anuncio', kwargs={'pk': anuncio_alheio.pk})
        response = self.client.patch(url_alheia, {'titulo': 'Hackeado'}, format='json')
        self.assertEqual(response.status_code, 404)

    def test_patch_sem_token(self):
        client_sem_token = APIClient()
        response = client_sem_token.patch(self.url, {'titulo': 'Hackeado'}, format='json')
        self.assertEqual(response.status_code, 401)


class TestesAPIExcluirAnuncio(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(username='testusuario', password='teste@123')
        self.token = Token.objects.create(user=self.usuario)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        self.peca = Peca.objects.create(usuario=self.usuario, marca=1, modelo='ModeloTeste', ano=2020, cor=1, tamanho=1, categoria=1)
        self.anuncio = Anuncio.objects.create(usuario=self.usuario, peca=self.peca, titulo='Titulo Teste', descricao='Desc', preco=99.99)
        self.url = reverse('api-excluir-anuncio', kwargs={'pk': self.anuncio.pk})

    def test_delete(self):
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Anuncio.objects.count(), 0)

    def test_delete_anuncio_alheio(self):
        outro_usuario = User.objects.create_user(username='outro', password='teste@123')
        peca_alheia = Peca.objects.create(usuario=outro_usuario, marca=1, modelo='Alheia', ano=2020, cor=1, tamanho=1, categoria=1)
        anuncio_alheio = Anuncio.objects.create(usuario=outro_usuario, peca=peca_alheia, titulo='Alheio', descricao='Desc', preco=50.00)
        url_alheia = reverse('api-excluir-anuncio', kwargs={'pk': anuncio_alheio.pk})
        response = self.client.delete(url_alheia)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Anuncio.objects.count(), 2)

    def test_delete_sem_token(self):
        client_sem_token = APIClient()
        response = client_sem_token.delete(self.url)
        self.assertEqual(response.status_code, 401)
