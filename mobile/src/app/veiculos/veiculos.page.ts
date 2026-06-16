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
import { Veiculo } from './veiculos.model';
import { Storage } from '@ionic/storage-angular';
import { Usuario } from '../home/usuario.model';
import { OPCOES_MARCA, OPCOES_COR, OPCOES_COMBUSTIVEL } from './veiculos.consts';

@Component({
  selector: 'app-veiculos',
  templateUrl: 'veiculos.page.html',
  styleUrls: ['veiculos.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonButton, IonButtons, IonSpinner, IonIcon,
    IonRefresher, IonRefresherContent, IonModal, IonInput,
    IonSelect, IonSelectOption, IonItemSliding, IonItemOptions, IonItemOption,
  ],
})
export class VeiculosPage implements OnInit {
  veiculos: Veiculo[] = [];
  carregando = true;
  nomeUsuario = '';
  modalAberto = false;
  veiculoEditando: Partial<Veiculo> = {};
  veiculoEditandoId: number | null = null;
  usuario!: Usuario;
  lista_veiculos: any[] = [];

  // Mapa de id → src base64 da foto
  fotosSrc: { [id: number]: string } = {};

  readonly opcoesMarca = OPCOES_MARCA;
  readonly opcoesCor = OPCOES_COR;
  readonly opcoesCombustivel = OPCOES_COMBUSTIVEL;

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
      this.consultarVeiculosSistemaWeb();
    } else {
      this.controle_navegacao.navigateRoot('/home');
    }
  }

  async handleRefresh(event: any) {
    await this.consultarVeiculosSistemaWeb();
    event.target.complete();
  }

  // ── Fotos autenticadas ────────────────────────────────────────────────────
  /**
   * Busca a foto via CapacitorHttp (com token), converte para base64
   * e armazena em fotosSrc para uso no template.
   * CapacitorHttp retorna binários como string base64 quando responseType = 'blob'.
   */
  private carregarFoto(veiculo: Veiculo) {
    if (!veiculo.foto || this.fotosSrc[veiculo.id]) return;

    const options: HttpOptions = {
      headers: {
        'Authorization': `Token ${this.usuario.token}`,
      },
      url: `http://localhost:8000/veiculo/api/foto/${veiculo.id}/`,
      responseType: 'blob',
    };

    CapacitorHttp.get(options)
      .then((resposta: HttpResponse) => {
        if (resposta.status === 200 && resposta.data) {
          // CapacitorHttp com responseType 'blob' retorna base64 diretamente em resposta.data
          this.fotosSrc[veiculo.id] = `data:image/jpeg;base64,${resposta.data}`;
        }
      })
      .catch((erro: any) => console.error(`Erro ao carregar foto do veículo ${veiculo.id}:`, erro));
  }

  private carregarTodasFotos(veiculos: Veiculo[]) {
    veiculos.forEach(v => this.carregarFoto(v));
  }

  // ── Listar ────────────────────────────────────────────────────────────────
  async consultarVeiculosSistemaWeb() {
    const loading = await this.controle_caregamento.create({ message: 'Carregando veículos...' });
    await loading.present();

    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.usuario.token}`,
      },
      url: 'http://localhost:8000/veiculo/api/listar/',
    };

    CapacitorHttp.get(options)
      .then((resposta: HttpResponse) => {
        if (resposta.status === 200) {
          this.lista_veiculos = resposta.data;
          this.veiculos = resposta.data;
          // Zera o cache de fotos e recarrega
          this.fotosSrc = {};
          this.carregarTodasFotos(this.veiculos);
        } else {
          this.apresenta_mensagem(`Erro ao carregar veículos: ${resposta.status}`);
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
  editarVeiculo(veiculo: Veiculo) {
    this.veiculoEditandoId = veiculo.id;
    this.veiculoEditando = {
      modelo:      veiculo.modelo,
      ano:         veiculo.ano,
      marca:       veiculo.marca,
      cor:         veiculo.cor,
      combustivel: veiculo.combustivel,
    };
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
    this.veiculoEditando = {};
    this.veiculoEditandoId = null;
  }

  async salvarEdicao() {
    if (!this.veiculoEditandoId) return;

    const payload = {
      modelo:      this.veiculoEditando.modelo,
      ano:         this.veiculoEditando.ano,
      marca:       this.veiculoEditando.marca,
      cor:         this.veiculoEditando.cor,
      combustivel: this.veiculoEditando.combustivel,
    };

    const loading = await this.controle_caregamento.create({ message: 'Salvando...' });
    await loading.present();

    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.usuario.token}`,
      },
      url: `http://localhost:8000/veiculo/api/editar/${this.veiculoEditandoId}/`,
      data: payload,
    };

    CapacitorHttp.patch(options)
      .then((resposta: HttpResponse) => {
        if (resposta.status === 200) {
          this.apresenta_mensagem('Veículo atualizado com sucesso!');
          this.fecharModal();
          this.consultarVeiculosSistemaWeb();
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
  async confirmarExclusao(veiculo: Veiculo) {
    const alerta = await this.controle_alerta.create({
      header: 'Excluir Veículo',
      message: `Deseja excluir o veículo ${veiculo.nome_marca} ${veiculo.modelo}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => this.excluirVeiculo(veiculo.id),
        },
      ],
    });
    await alerta.present();
  }

  async excluirVeiculo(id: number) {
    const loading = await this.controle_caregamento.create({ message: 'Excluindo...' });
    await loading.present();

    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.usuario.token}`,
      },
      url: `http://localhost:8000/veiculo/api/excluir/${id}/`,
    };

    CapacitorHttp.delete(options)
      .then((resposta: HttpResponse) => {
        if (resposta.status === 204) {
          this.veiculos = this.veiculos.filter(v => v.id !== id);
          delete this.fotosSrc[id];
          this.apresenta_mensagem('Veículo excluído com sucesso!');
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