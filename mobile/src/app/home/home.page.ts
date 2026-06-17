import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton,
  IonText, IonSpinner,
  ToastController, LoadingController, NavController, AlertController,
} from '@ionic/angular/standalone';
import { CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';
import { Storage } from '@ionic/storage-angular';
import { Usuario } from './usuario.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonInput, IonButton, IonText, IonSpinner,
  ],
})
export class HomePage implements OnInit {

  username = '';
  password = '';

  constructor(
    public storage: Storage,
    public controle_caregamento: LoadingController,
    public controle_navegacao: NavController,
    public controle_alerta: AlertController,
    public controle_toast: ToastController,
  ) {}

  async ngOnInit() {
    await this.storage.create();

    // Se já existe sessão salva, vai direto para peças
    const registro = await this.storage.get('usuario');
    if (registro) {
      this.controle_navegacao.navigateRoot('/tabs/pecas');
    }
  }

  async login() {
    if (!this.username.trim() || !this.password.trim()) {
      await this.apresenta_mensagem('Preencha usuário e senha.');
      return;
    }

    const loading = await this.controle_caregamento.create({ message: 'Autenticando...' });
    await loading.present();

    const options: HttpOptions = {
      headers: { 'Content-Type': 'application/json' },
      url: `${environment.apiUrl}/api/autenticacao-api/`,
      method: 'POST',
      data: {
        username: this.username,
        password: this.password,
      },
    };

    CapacitorHttp.post(options)
      .then(async (resposta: HttpResponse) => {
        await loading.dismiss();
        if (resposta.status === 200) {
          const usuario: Usuario = Object.assign(new Usuario(), resposta.data);
          await this.storage.set('usuario', usuario);
          this.controle_navegacao.navigateRoot('/tabs/pecas');
        } else {
          await this.apresenta_mensagem('Usuário ou senha inválidos.');
        }
      })
      .catch(async (erro: any) => {
        await loading.dismiss();
        console.error('Erro de autenticação:', erro);
        await this.apresenta_mensagem(`Falha na autenticação — código: ${erro?.status ?? 'sem conexão'}`);
      });
  }

  async forgotPassword() {
    const alerta = await this.controle_alerta.create({
      header: 'Recuperar senha',
      message: 'Entre em contato com o administrador do sistema para redefinir sua senha.',
      buttons: ['OK'],
    });
    await alerta.present();
  }

  async goToRegister() {
    const alerta = await this.controle_alerta.create({
      header: 'Criar conta',
      message: 'O cadastro de novos usuários é realizado pelo administrador do sistema.',
      buttons: ['OK'],
    });
    await alerta.present();
  }

  async apresenta_mensagem(mensagem: string) {
    const toast = await this.controle_toast.create({
      message: mensagem,
      cssClass: 'ion-text-center',
      duration: 3000,
    });
    await toast.present();
  }
}