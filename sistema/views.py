from django.views.generic import View
from django.shortcuts import redirect, render
from django.contrib.auth import authenticate as authrenticate, login, logout
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token, settings
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken

class Login(View):

    """
    class based view para autenticacao de usuarios
    """

    def get(self, request):
        context = {'mensagem': ''}
        if request.user.is_authenticated:
            return redirect("listar-pecas")
        else:
            return render(request, 'autenticacao.html', context)
    
    def post(self, request):
        usuario = request.POST.get('usuario', None)
        senha = request.POST.get('senha', None)

        user = authrenticate(request, username=usuario, password=senha)
        if user is not None:
            #verificar se esta ativo
            if user.is_active:
                login(request, user)
                return redirect("listar-pecas")
            else:
                return render(request, 'autenticacao.html', {"mensagem": "Usuario inativo"})
        return render (request, 'autenticacao.html', {"mensagem": "Usuario ou senha invalidos"})
    
class Logout(View):
    def get(self, request):
        logout(request)
        return redirect(settings.LOGIN_URL)
    
class LoginAPI(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer= self.serializer_class(
            data=request.data,
            context={
                'request': request
            }
        )
        serializer.is_valid(raise_exception=True)
        user=serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'id': user.id,
            'nome':user.first_name,
            'email':user.email,
            'token': token.key
        })