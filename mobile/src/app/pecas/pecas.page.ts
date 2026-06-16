import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonButton, IonButtons, IonSpinner, IonIcon,
  IonRefresher, IonRefresherContent, IonModal, IonInput,
  IonSelect, IonSelectOption, IonItemSliding, IonItemOptions, IonItemOption,
  ToastController, AlertController, NavController, LoadingController,
} from '@ionic/angular/standalone';
import { CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';
import { Peca } from './pecas.model';
import { Storage } from '@ionic/storage-angular';
import { Usuario } from '../home/usuario.model';
import { OPCOES_MARCA, OPCOES_COR, OPCOES_TAMANHO, OPCOES_CATEGORIA } from './pecas.consts';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-pecas',
  templateUrl: 'pecas.page.html',
  styleUrls: ['pecas.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonButton, IonButtons, IonSpinner, IonIcon,
    IonRefresher, IonRefresherContent, IonModal, IonInput,
    IonSelect, IonSelectOption, IonItemSliding, IonItemOptions, IonItemOption,
  ],
})
export class PecasPage implements OnInit {
  pecas: Peca[] = [];
  carregando = true;
  nomeUsuario = '';
  modalAberto = false;
  pecaEditando: Partial<Peca> = {};
  pecaEditandoId: number | null = null;
  usuario!: Usuario;
  lista_pecas: any[] = [];
  categoriaFiltro: number | null = null;

  // Mapa de id → src base64 da foto
  fotosSrc: { [id: number]: string } = {};

  readonly opcoesMarca = OPCOES_MARCA;
  readonly opcoesCor = OPCOES_COR;
  readonly opcoesTamanho = OPCOES_TAMANHO;
  readonly opcoesCategoria = OPCOES_CATEGORIA;

  constructor(
    public storage: Storage,
    public controle_caregamento: LoadingController,
    public controle_navegacao: NavController,
    public controle_alerta: AlertController,
    public controle_toast: ToastController,
  ) {}

  async ngOnInit() {
    await this.storage.create();
    const registro = await this.storage.get('usuario');

    if (registro) {
      this.usuario = Object.assign(new Usuario(), registro);
      this.nomeUsuario = this.usuario.nome || 'Usuário';
      this.consultarPecas();
    } else {
      this.controle_navegacao.navigateRoot('/home');
    }
  }

  async handleRefresh(event: any) {
    await this.consultarPecas();
    event.target.complete();
  }

  async filtrarPorCategoria() {
    await this.consultarPecas();
  }

  // ── Fotos autenticadas ────────────────────────────────────────────────────
  /**
   * Busca a foto via CapacitorHttp (com token), converte para base64
   * e armazena em fotosSrc para uso no template.
   * CapacitorHttp retorna binários como string base64 quando responseType = 'blob'.
   */
  private carregarFoto(peca: Peca) {
    if (!peca.foto || this.fotosSrc[peca.id]) return;

    const options: HttpOptions = {
      headers: {
        'Authorization': `Token ${this.usuario.token}`,
      },
      url: `${environment.apiUrl}/peca/api/foto/${peca.id}/`,
      responseType: 'blob',
    };

    CapacitorHttp.get(options)
      .then((resposta: HttpResponse) => {
        if (resposta.status === 200 && resposta.data) {
          // CapacitorHttp com responseType 'blob' retorna base64 diretamente em resposta.data
          this.fotosSrc[peca.id] = `data:image/jpeg;base64,${resposta.data}`;
        }
      })
      .catch((erro: any) => console.error(`Erro ao carregar foto da peça ${peca.id}:`, erro));
  }

  private carregarTodasFotos(pecas: Peca[]) {
    pecas.forEach(p => this.carregarFoto(p));
  }

  // ── Listar ────────────────────────────────────────────────────────────────
  async consultarPecas() {
    const loading = await this.controle_caregamento.create({ message: 'Carregando peças...' });
    await loading.present();

    let url = `${environment.apiUrl}/peca/api/listar/`;
    if (this.categoriaFiltro) {
      url += `?categoria=${this.categoriaFiltro}`;
    }

    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.usuario.token}`,
      },
      url,
    };

    CapacitorHttp.get(options)
      .then((resposta: HttpResponse) => {
        if (resposta.status === 200) {
          this.lista_pecas = resposta.data;
          this.pecas = resposta.data;
          // Zera o cache de fotos e recarrega
          this.fotosSrc = {};
          this.carregarTodasFotos(this.pecas);
        } else {
          this.apresenta_mensagem(`Erro ao carregar peças: ${resposta.status}`);
        }
      })
      .catch(async (erro: any) => {
        console.error(erro);
        this.apresenta_mensagem(`Erro de conexão: ${erro?.status ?? 'desconhecido'}`);
      })
      .finally(async () => {
        await loading.dismiss();
        this.carregando = false;
      });
  }

  // ── Editar ────────────────────────────────────────────────────────────────
  editarPeca(peca: Peca) {
    this.pecaEditandoId = peca.id;
    this.pecaEditando = {
      modelo:    peca.modelo,
      ano:       peca.ano,
      marca:     peca.marca,
      cor:       peca.cor,
      tamanho:   peca.tamanho,
      categoria: peca.categoria,
    };
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
    this.pecaEditando = {};
    this.pecaEditandoId = null;
  }

  async salvarEdicao() {
    if (!this.pecaEditandoId) return;

    const payload = {
      modelo:    this.pecaEditando.modelo,
      ano:       this.pecaEditando.ano,
      marca:     this.pecaEditando.marca,
      cor:       this.pecaEditando.cor,
      tamanho:   this.pecaEditando.tamanho,
      categoria: this.pecaEditando.categoria,
    };

    const loading = await this.controle_caregamento.create({ message: 'Salvando...' });
    await loading.present();

    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.usuario.token}`,
      },
      url: `${environment.apiUrl}/peca/api/editar/${this.pecaEditandoId}/`,
      data: payload,
    };

    CapacitorHttp.patch(options)
      .then((resposta: HttpResponse) => {
        if (resposta.status === 200) {
          this.apresenta_mensagem('Peça atualizada com sucesso!');
          this.fecharModal();
          this.consultarPecas();
        } else {
          this.apresenta_mensagem(`Erro ao salvar: ${resposta.status}`);
        }
      })
      .catch((erro: any) => {
        console.error(erro);
        this.apresenta_mensagem(`Erro de conexão: ${erro?.status ?? 'desconhecido'}`);
      })
      .finally(async () => await loading.dismiss());
  }

  // ── Excluir ───────────────────────────────────────────────────────────────
  async confirmarExclusao(peca: Peca) {
    const alerta = await this.controle_alerta.create({
      header: 'Excluir Peça',
      message: `Deseja excluir a peça ${peca.nome_marca} ${peca.modelo}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => this.excluirPeca(peca.id),
        },
      ],
    });
    await alerta.present();
  }

  async excluirPeca(id: number) {
    const loading = await this.controle_caregamento.create({ message: 'Excluindo...' });
    await loading.present();

    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.usuario.token}`,
      },
      url: `${environment.apiUrl}/peca/api/excluir/${id}/`,
    };

    CapacitorHttp.delete(options)
      .then((resposta: HttpResponse) => {
        if (resposta.status === 204) {
          this.pecas = this.pecas.filter(p => p.id !== id);
          delete this.fotosSrc[id];
          this.apresenta_mensagem('Peça excluída com sucesso!');
        } else {
          this.apresenta_mensagem(`Erro ao excluir: ${resposta.status}`);
        }
      })
      .catch((erro: any) => {
        console.error(erro);
        this.apresenta_mensagem(`Erro de conexão: ${erro?.status ?? 'desconhecido'}`);
      })
      .finally(async () => await loading.dismiss());
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  async confirmarLogout() {
    const alerta = await this.controle_alerta.create({
      header: 'Sair',
      message: 'Deseja realmente sair da sua conta?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sair',
          role: 'destructive',
          handler: async () => {
            await this.storage.remove('usuario');
            this.controle_navegacao.navigateRoot('/', { animationDirection: 'back' });
          },
        },
      ],
    });
    await alerta.present();
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  async apresenta_mensagem(mensagem: any) {
    const toast = await this.controle_toast.create({
      message: typeof mensagem === 'string' ? mensagem : `Erro: ${mensagem}`,
      duration: 3000,
    });
    await toast.present();
  }
}
