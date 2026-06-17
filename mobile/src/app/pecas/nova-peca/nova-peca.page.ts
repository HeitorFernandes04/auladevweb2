import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton,
  IonItem, IonLabel, IonButton, IonButtons, IonInput,
  IonSelect, IonSelectOption,
  ToastController, LoadingController, NavController,
} from '@ionic/angular/standalone';
import { CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';
import { Storage } from '@ionic/storage-angular';
import { Usuario } from '../../home/usuario.model';
import { OPCOES_MARCA, OPCOES_COR, OPCOES_TAMANHO, OPCOES_CATEGORIA } from '../pecas.consts';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-nova-peca',
  templateUrl: 'nova-peca.page.html',
  styleUrls: ['nova-peca.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton,
    IonItem, IonLabel, IonButton, IonButtons, IonInput,
    IonSelect, IonSelectOption,
  ],
})
export class NovaPecaPage implements OnInit {
  usuario!: Usuario;
  fotoSelecionada: File | null = null;

  novaPeca = {
    modelo: '',
    ano: new Date().getFullYear(),
    marca: null as number | null,
    cor: null as number | null,
    tamanho: null as number | null,
    categoria: null as number | null,
  };

  readonly opcoesMarca = OPCOES_MARCA;
  readonly opcoesCor = OPCOES_COR;
  readonly opcoesTamanho = OPCOES_TAMANHO;
  readonly opcoesCategoria = OPCOES_CATEGORIA;

  constructor(
    public storage: Storage,
    public controle_toast: ToastController,
    public controle_carregamento: LoadingController,
    public controle_navegacao: NavController,
  ) {}

  async ngOnInit() {
    await this.storage.create();
    const registro = await this.storage.get('usuario');
    if (registro) {
      this.usuario = Object.assign(new Usuario(), registro);
    } else {
      this.controle_navegacao.navigateRoot('/home');
    }
  }

  onFotoSelecionada(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.fotoSelecionada = input.files[0];
    }
  }

  async salvar() {
    if (!this.novaPeca.modelo || !this.novaPeca.marca || !this.novaPeca.cor ||
        !this.novaPeca.tamanho || !this.novaPeca.categoria) {
      await this.apresentaMensagem('Preencha todos os campos obrigatórios.');
      return;
    }

    const loading = await this.controle_carregamento.create({ message: 'Criando peça...' });
    await loading.present();

    const formData = new FormData();
    formData.append('modelo', this.novaPeca.modelo);
    formData.append('ano', String(this.novaPeca.ano));
    formData.append('marca', String(this.novaPeca.marca));
    formData.append('cor', String(this.novaPeca.cor));
    formData.append('tamanho', String(this.novaPeca.tamanho));
    formData.append('categoria', String(this.novaPeca.categoria));
    if (this.fotoSelecionada) {
      formData.append('foto', this.fotoSelecionada);
    }

    const options: HttpOptions = {
      headers: { 'Authorization': `Token ${this.usuario.token}` },
      url: `${environment.apiUrl}/peca/api/novo/`,
      data: formData,
    };

    CapacitorHttp.post(options)
      .then(async (resposta: HttpResponse) => {
        if (resposta.status === 201) {
          await this.apresentaMensagem('Peça criada com sucesso!');
          this.controle_navegacao.back();
        } else {
          await this.apresentaMensagem(`Erro ao criar peça: ${resposta.status}`);
        }
      })
      .catch(async (erro: any) => {
        console.error(erro);
        await this.apresentaMensagem(`Erro de conexão: ${erro?.status ?? 'desconhecido'}`);
      })
      .finally(async () => await loading.dismiss());
  }

  async apresentaMensagem(mensagem: string) {
    const toast = await this.controle_toast.create({ message: mensagem, duration: 3000 });
    await toast.present();
  }
}
