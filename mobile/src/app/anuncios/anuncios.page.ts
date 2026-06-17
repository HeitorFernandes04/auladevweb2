import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonButton, IonButtons, IonSpinner, IonIcon,
  IonRefresher, IonRefresherContent, IonModal, IonInput, IonTextarea,
  IonItemSliding, IonItemOptions, IonItemOption,
  ToastController, AlertController, LoadingController, NavController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { megaphoneOutline, pencilOutline, trashOutline, closeOutline } from 'ionicons/icons';
import { CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';
import { Anuncio } from './anuncios.model';
import { Storage } from '@ionic/storage-angular';
import { Usuario } from '../home/usuario.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-anuncios',
  templateUrl: 'anuncios.page.html',
  styleUrls: ['anuncios.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonButton, IonButtons, IonSpinner, IonIcon,
    IonRefresher, IonRefresherContent, IonModal, IonInput, IonTextarea,
    IonItemSliding, IonItemOptions, IonItemOption,
  ],
})
export class AnunciosPage implements OnInit {
  anuncios: Anuncio[] = [];
  carregando = true;
  usuario!: Usuario;

  modalAberto = false;
  anuncioEditandoId: number | null = null;
  anuncioEditando: Partial<Anuncio> = {};

  constructor(
    public storage: Storage,
    public controle_carregamento: LoadingController,
    public controle_navegacao: NavController,
    public controle_alerta: AlertController,
    public controle_toast: ToastController,
  ) {
    addIcons({ megaphoneOutline, pencilOutline, trashOutline, closeOutline });
  }

  async ngOnInit() {
    await this.storage.create();
    const registro = await this.storage.get('usuario');
    if (registro) {
      this.usuario = Object.assign(new Usuario(), registro);
      this.consultarAnuncios();
    } else {
      this.controle_navegacao.navigateRoot('/home');
    }
  }

  async ionViewWillEnter() {
    if (this.usuario?.token) {
      await this.consultarAnuncios();
    }
  }

  async handleRefresh(event: any) {
    await this.consultarAnuncios();
    event.target.complete();
  }

  // ── Listar ────────────────────────────────────────────────────────────────
  async consultarAnuncios() {
    const loading = await this.controle_carregamento.create({ message: 'Carregando anúncios...' });
    await loading.present();

    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.usuario.token}`,
      },
      url: `${environment.apiUrl}/anuncio/api/listar/`,
    };

    CapacitorHttp.get(options)
      .then((resposta: HttpResponse) => {
        if (resposta.status === 200) {
          this.anuncios = resposta.data;
        } else {
          this.apresentaMensagem(`Erro ao carregar anúncios: ${resposta.status}`);
        }
      })
      .catch((erro: any) => {
        console.error(erro);
        this.apresentaMensagem(`Erro de conexão: ${erro?.status ?? 'desconhecido'}`);
      })
      .finally(async () => {
        await loading.dismiss();
        this.carregando = false;
      });
  }

  // ── Editar ────────────────────────────────────────────────────────────────
  editarAnuncio(anuncio: Anuncio) {
    this.anuncioEditandoId = anuncio.id;
    this.anuncioEditando = {
      titulo:   anuncio.titulo,
      descricao: anuncio.descricao,
      preco:    anuncio.preco,
    };
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
    this.anuncioEditando = {};
    this.anuncioEditandoId = null;
  }

  async salvarEdicao() {
    if (!this.anuncioEditandoId) return;

    const loading = await this.controle_carregamento.create({ message: 'Salvando...' });
    await loading.present();

    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.usuario.token}`,
      },
      url: `${environment.apiUrl}/anuncio/api/editar/${this.anuncioEditandoId}/`,
      data: {
        titulo:    this.anuncioEditando.titulo,
        descricao: this.anuncioEditando.descricao,
        preco:     this.anuncioEditando.preco,
      },
    };

    CapacitorHttp.patch(options)
      .then((resposta: HttpResponse) => {
        if (resposta.status === 200) {
          this.apresentaMensagem('Anúncio atualizado com sucesso!');
          this.fecharModal();
          this.consultarAnuncios();
        } else {
          this.apresentaMensagem(`Erro ao salvar: ${resposta.status}`);
        }
      })
      .catch((erro: any) => {
        console.error(erro);
        this.apresentaMensagem(`Erro de conexão: ${erro?.status ?? 'desconhecido'}`);
      })
      .finally(async () => await loading.dismiss());
  }

  // ── Excluir ───────────────────────────────────────────────────────────────
  async confirmarExclusao(anuncio: Anuncio) {
    const alerta = await this.controle_alerta.create({
      header: 'Excluir Anúncio',
      message: `Deseja excluir o anúncio "${anuncio.titulo}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => this.excluirAnuncio(anuncio.id),
        },
      ],
    });
    await alerta.present();
  }

  async excluirAnuncio(id: number) {
    const loading = await this.controle_carregamento.create({ message: 'Excluindo...' });
    await loading.present();

    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.usuario.token}`,
      },
      url: `${environment.apiUrl}/anuncio/api/excluir/${id}/`,
    };

    CapacitorHttp.delete(options)
      .then((resposta: HttpResponse) => {
        if (resposta.status === 204) {
          this.anuncios = this.anuncios.filter(a => a.id !== id);
          this.apresentaMensagem('Anúncio excluído com sucesso!');
        } else {
          this.apresentaMensagem(`Erro ao excluir: ${resposta.status}`);
        }
      })
      .catch((erro: any) => {
        console.error(erro);
        this.apresentaMensagem(`Erro de conexão: ${erro?.status ?? 'desconhecido'}`);
      })
      .finally(async () => await loading.dismiss());
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  async apresentaMensagem(mensagem: string) {
    const toast = await this.controle_toast.create({ message: mensagem, duration: 3000 });
    await toast.present();
  }
}
