import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonButton, IonButtons, IonSpinner, IonIcon,
  IonRefresher, IonRefresherContent, IonModal, IonInput, IonTextarea,
  IonItemSliding, IonItemOptions, IonItemOption,
  IonSearchbar, IonChip,
  ToastController, AlertController, LoadingController, NavController,
  ActionSheetController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  megaphoneOutline, pencilOutline, trashOutline, closeOutline,
  addOutline, arrowBackOutline, shirtOutline, funnelOutline, closeCircle,
} from 'ionicons/icons';
import { CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';
import { Anuncio } from './anuncios.model';
import { Peca } from '../pecas/pecas.model';
import { Storage } from '@ionic/storage-angular';
import { Usuario } from '../home/usuario.model';
import { environment } from 'src/environments/environment';
import {
  OPCOES_MARCA, OPCOES_COR, OPCOES_TAMANHO, OPCOES_CATEGORIA,
} from '../pecas/pecas.consts';

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
    IonSearchbar, IonChip,
  ],
})
export class AnunciosPage implements OnInit {
  anuncios: Anuncio[] = [];
  fotosSrc: { [id: number]: string } = {};
  carregando = true;
  usuario!: Usuario;

  // Filtros e busca
  textoBusca = '';
  filtroMarca:     number | null = null;
  filtroCor:       number | null = null;
  filtroTamanho:   number | null = null;
  filtroCategoria: number | null = null;

  // Modal de edição
  modalAberto = false;
  anuncioEditandoId: number | null = null;
  anuncioEditando: Partial<Anuncio> = {};

  // Modal de criação (2 etapas)
  modalCriarAberto = false;
  etapaCriar: 'selecionar' | 'preencher' = 'selecionar';
  pecasDisponiveis: Peca[] = [];
  carregandoPecas = false;
  pecaSelecionadaCriar: Peca | null = null;
  novoAnuncio = { titulo: '', descricao: '', preco: null as number | null };

  constructor(
    public storage: Storage,
    public controle_carregamento: LoadingController,
    public controle_navegacao: NavController,
    public controle_alerta: AlertController,
    public controle_toast: ToastController,
    public controle_sheet: ActionSheetController,
  ) {
    addIcons({
      megaphoneOutline, pencilOutline, trashOutline, closeOutline,
      addOutline, arrowBackOutline, shirtOutline, funnelOutline, closeCircle,
    });
  }

  ngOnInit(): void {
    void this.inicializar();
  }

  private async inicializar() {
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

  // ── Filtros ───────────────────────────────────────────────────────────────
  get anunciosFiltrados(): Anuncio[] {
    const texto = this.textoBusca.toLowerCase().trim();
    return this.anuncios.filter(a => {
      if (texto && !(
        a.titulo.toLowerCase().includes(texto) ||
        a.nome_peca.toLowerCase().includes(texto) ||
        a.nome_marca.toLowerCase().includes(texto)
      )) return false;
      if (this.filtroMarca     !== null && a.marca     !== this.filtroMarca)     return false;
      if (this.filtroCor       !== null && a.cor       !== this.filtroCor)       return false;
      if (this.filtroTamanho   !== null && a.tamanho   !== this.filtroTamanho)   return false;
      if (this.filtroCategoria !== null && a.categoria !== this.filtroCategoria) return false;
      return true;
    });
  }

  get temFiltroAtivo(): boolean {
    return this.filtroMarca !== null || this.filtroCor !== null ||
           this.filtroTamanho !== null || this.filtroCategoria !== null;
  }

  async abrirFiltro(tipo: 'marca' | 'cor' | 'tamanho' | 'categoria') {
    let opcoes: { valor: number; label: string }[];
    if (tipo === 'marca')          opcoes = OPCOES_MARCA;
    else if (tipo === 'cor')       opcoes = OPCOES_COR;
    else if (tipo === 'tamanho')   opcoes = OPCOES_TAMANHO;
    else                           opcoes = OPCOES_CATEGORIA;

    const sheet = await this.controle_sheet.create({
      buttons: [
        ...opcoes.map(op => ({
          text: op.label,
          handler: () => {
            if (tipo === 'marca')     this.filtroMarca     = op.valor;
            if (tipo === 'cor')       this.filtroCor       = op.valor;
            if (tipo === 'tamanho')   this.filtroTamanho   = op.valor;
            if (tipo === 'categoria') this.filtroCategoria = op.valor;
          },
        })),
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  limparFiltros() {
    this.filtroMarca = null;
    this.filtroCor = null;
    this.filtroTamanho = null;
    this.filtroCategoria = null;
    this.textoBusca = '';
  }

  // ── Listar (vitrine — todos os anúncios) ──────────────────────────────────
  async consultarAnuncios() {
    const loading = await this.controle_carregamento.create({ message: 'Carregando anúncios...' });
    await loading.present();

    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.usuario.token}`,
      },
      url: `${environment.apiUrl}/anuncio/api/listar-todos/`,
    };

    CapacitorHttp.get(options)
      .then((resposta: HttpResponse) => {
        if (resposta.status === 200) {
          this.anuncios = resposta.data;
          this.carregarFotos();
        } else {
          this.apresentaMensagem(`Erro ao carregar anúncios: ${resposta.status}`);
        }
      })
      .catch((error_: any) => {
        console.error(error_);
        this.apresentaMensagem(`Erro de conexão: ${error_?.status ?? 'desconhecido'}`);
      })
      .finally(async () => {
        await loading.dismiss();
        this.carregando = false;
      });
  }

  // ── Fotos (carregadas via peca_id da peça vinculada) ─────────────────────
  carregarFotos() {
    for (const anuncio of this.anuncios) {
      const pecaId = anuncio.peca;
      if (this.fotosSrc[pecaId]) continue;

      const options: HttpOptions = {
        headers: { 'Authorization': `Token ${this.usuario.token}` },
        url: `${environment.apiUrl}/peca/api/foto/${pecaId}/`,
        responseType: 'blob',
      };

      CapacitorHttp.get(options)
        .then((resposta: HttpResponse) => {
          if (resposta.status === 200) {
            this.fotosSrc[pecaId] = `data:image/jpeg;base64,${resposta.data}`;
          }
        })
        .catch(() => {});
    }
  }

  // ── Criar anúncio (modal 2 etapas) ───────────────────────────────────────
  async abrirModalCriar() {
    this.etapaCriar = 'selecionar';
    this.pecaSelecionadaCriar = null;
    this.novoAnuncio = { titulo: '', descricao: '', preco: null };
    this.modalCriarAberto = true;
    this.carregandoPecas = true;

    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.usuario.token}`,
      },
      url: `${environment.apiUrl}/peca/api/listar/`,
    };

    CapacitorHttp.get(options)
      .then((resposta: HttpResponse) => {
        if (resposta.status === 200) {
          this.pecasDisponiveis = resposta.data;
        } else {
          this.apresentaMensagem('Erro ao carregar suas peças.');
        }
      })
      .catch((error_: any) => {
        console.error(error_);
        this.apresentaMensagem('Erro ao carregar suas peças.');
      })
      .finally(() => { this.carregandoPecas = false; });
  }

  selecionarPecaCriar(peca: Peca) {
    this.pecaSelecionadaCriar = peca;
    this.etapaCriar = 'preencher';
  }

  voltarParaSelecao() {
    this.etapaCriar = 'selecionar';
    this.pecaSelecionadaCriar = null;
  }

  fecharModalCriar() {
    this.modalCriarAberto = false;
    this.etapaCriar = 'selecionar';
    this.pecaSelecionadaCriar = null;
    this.novoAnuncio = { titulo: '', descricao: '', preco: null };
  }

  async publicarAnuncio() {
    if (!this.pecaSelecionadaCriar) return;
    if (!this.novoAnuncio.titulo || !this.novoAnuncio.preco) {
      await this.apresentaMensagem('Preencha título e preço.');
      return;
    }

    const loading = await this.controle_carregamento.create({ message: 'Publicando anúncio...' });
    await loading.present();

    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.usuario.token}`,
      },
      url: `${environment.apiUrl}/anuncio/api/novo/`,
      data: {
        titulo:    this.novoAnuncio.titulo,
        descricao: this.novoAnuncio.descricao,
        preco:     this.novoAnuncio.preco,
        peca:      this.pecaSelecionadaCriar.id,
      },
    };

    CapacitorHttp.post(options)
      .then(async (resposta: HttpResponse) => {
        if (resposta.status === 201) {
          await this.apresentaMensagem('Anúncio publicado com sucesso!');
          this.fecharModalCriar();
          this.consultarAnuncios();
        } else {
          await this.apresentaMensagem(`Erro ao publicar: ${resposta.status}`);
        }
      })
      .catch(async (error_: any) => {
        console.error(error_);
        await this.apresentaMensagem(`Erro de conexão: ${error_?.status ?? 'desconhecido'}`);
      })
      .finally(async () => await loading.dismiss());
  }

  // ── Editar (só próprios anúncios) ────────────────────────────────────────
  editarAnuncio(anuncio: Anuncio) {
    this.anuncioEditandoId = anuncio.id;
    this.anuncioEditando = {
      titulo:    anuncio.titulo,
      descricao: anuncio.descricao,
      preco:     anuncio.preco,
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
      .catch((error_: any) => {
        console.error(error_);
        this.apresentaMensagem(`Erro de conexão: ${error_?.status ?? 'desconhecido'}`);
      })
      .finally(async () => await loading.dismiss());
  }

  // ── Excluir (só próprios anúncios) ───────────────────────────────────────
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
      .catch((error_: any) => {
        console.error(error_);
        this.apresentaMensagem(`Erro de conexão: ${error_?.status ?? 'desconhecido'}`);
      })
      .finally(async () => await loading.dismiss());
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  async apresentaMensagem(mensagem: string) {
    const toast = await this.controle_toast.create({ message: mensagem, duration: 3000 });
    await toast.present();
  }
}
