import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonButton, IonButtons, IonSpinner, IonIcon,
  IonRefresher, IonRefresherContent, IonModal, IonInput, IonTextarea,
  IonSelect, IonSelectOption, IonItemSliding, IonItemOptions, IonItemOption,
  IonSearchbar, IonChip,
  AlertController, NavController, LoadingController, ToastController, ActionSheetController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  shirtOutline, pencilOutline, megaphoneOutline, trashOutline,
  closeOutline, chevronDownOutline, searchOutline,
} from 'ionicons/icons';
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
    IonRefresher, IonRefresherContent, IonModal, IonInput, IonTextarea,
    IonSelect, IonSelectOption, IonItemSliding, IonItemOptions, IonItemOption,
    IonSearchbar, IonChip,
  ],
})
export class PecasPage implements OnInit {
  pecas: Peca[] = [];
  carregando = true;
  usuario!: Usuario;

  fotosSrc: { [id: number]: string } = {};

  // Busca e filtros
  textoBusca = '';
  filtroCategoria: number | null = null;
  filtroMarca: number | null = null;
  filtroTamanho: number | null = null;
  filtroCor: number | null = null;

  // Modal de edição de peça
  modalAberto = false;
  pecaEditando: Partial<Peca> = {};
  pecaEditandoId: number | null = null;
  fotoAtualSrc = '';
  fotoNova: File | null = null;

  // Modal de criação de anúncio
  modalAnuncioAberto = false;
  pecaSelecionada: Peca | null = null;
  novoAnuncio = { titulo: '', descricao: '', preco: null as number | null };

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
    public actionSheetCtrl: ActionSheetController,
  ) {
    addIcons({ shirtOutline, pencilOutline, megaphoneOutline, trashOutline, closeOutline, chevronDownOutline, searchOutline });
  }

  async ngOnInit() {
    await this.storage.create();
    const registro = await this.storage.get('usuario');

    if (registro) {
      this.usuario = Object.assign(new Usuario(), registro);
      this.consultarPecas();
    } else {
      this.controle_navegacao.navigateRoot('/home');
    }
  }

  async ionViewWillEnter() {
    if (this.usuario?.token) {
      await this.consultarPecas();
    }
  }

  async handleRefresh(event: any) {
    await this.consultarPecas();
    event.target.complete();
  }

  // ── Busca e filtros ───────────────────────────────────────────────────────
  get pecasFiltradas(): Peca[] {
    return this.pecas.filter(p => {
      const texto = this.textoBusca.toLowerCase().trim();
      const matchTexto = !texto ||
        p.modelo?.toLowerCase().includes(texto) ||
        p.nome_marca?.toLowerCase().includes(texto) ||
        p.nome_categoria?.toLowerCase().includes(texto);
      const matchCategoria = !this.filtroCategoria || p.categoria === this.filtroCategoria;
      const matchMarca = !this.filtroMarca || p.marca === this.filtroMarca;
      const matchTamanho = !this.filtroTamanho || p.tamanho === this.filtroTamanho;
      const matchCor = !this.filtroCor || p.cor === this.filtroCor;
      return matchTexto && matchCategoria && matchMarca && matchTamanho && matchCor;
    });
  }

  get temFiltroAtivo(): boolean {
    return !!(this.filtroCategoria || this.filtroMarca || this.filtroTamanho || this.filtroCor || this.textoBusca);
  }

  get labelCategoria(): string {
    return OPCOES_CATEGORIA.find(o => o.valor === this.filtroCategoria)?.label ?? 'Categoria';
  }

  get labelMarca(): string {
    return OPCOES_MARCA.find(o => o.valor === this.filtroMarca)?.label ?? 'Marca';
  }

  get labelTamanho(): string {
    return OPCOES_TAMANHO.find(o => o.valor === this.filtroTamanho)?.label ?? 'Tamanho';
  }

  get labelCor(): string {
    return OPCOES_COR.find(o => o.valor === this.filtroCor)?.label ?? 'Cor';
  }

  limparFiltros() {
    this.filtroCategoria = null;
    this.filtroMarca = null;
    this.filtroTamanho = null;
    this.filtroCor = null;
    this.textoBusca = '';
  }

  async abrirFiltro(tipo: 'categoria' | 'marca' | 'tamanho' | 'cor') {
    const configs: Record<string, { opcoes: { valor: number; label: string }[]; header: string }> = {
      categoria: { opcoes: OPCOES_CATEGORIA, header: 'Categoria' },
      marca:     { opcoes: OPCOES_MARCA,     header: 'Marca'     },
      tamanho:   { opcoes: OPCOES_TAMANHO,   header: 'Tamanho'   },
      cor:       { opcoes: OPCOES_COR,       header: 'Cor'       },
    };

    const { opcoes, header } = configs[tipo];

    const sheet = await this.actionSheetCtrl.create({
      header,
      buttons: [
        ...opcoes.map(opcao => ({
          text: opcao.label,
          handler: () => {
            if (tipo === 'categoria') this.filtroCategoria = opcao.valor;
            else if (tipo === 'marca') this.filtroMarca = opcao.valor;
            else if (tipo === 'tamanho') this.filtroTamanho = opcao.valor;
            else this.filtroCor = opcao.valor;
          },
        })),
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  // ── Fotos autenticadas ────────────────────────────────────────────────────
  private carregarFoto(peca: Peca) {
    if (!peca.foto || this.fotosSrc[peca.id]) return;

    const options: HttpOptions = {
      headers: { 'Authorization': `Token ${this.usuario.token}` },
      url: `${environment.apiUrl}/peca/api/foto/${peca.id}/`,
      responseType: 'blob',
    };

    CapacitorHttp.get(options)
      .then((resposta: HttpResponse) => {
        if (resposta.status === 200 && resposta.data) {
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
          this.pecas = resposta.data;
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
    this.fotoAtualSrc = this.fotosSrc[peca.id] || '';
    this.fotoNova = null;
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
    this.pecaEditando = {};
    this.pecaEditandoId = null;
    this.fotoAtualSrc = '';
    this.fotoNova = null;
  }

  onFotoNovaSelecionada(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.fotoNova = input.files[0];
    }
  }

  async salvarEdicao() {
    if (!this.pecaEditandoId) return;

    const loading = await this.controle_caregamento.create({ message: 'Salvando...' });
    await loading.present();

    let options: HttpOptions;

    if (this.fotoNova) {
      const formData = new FormData();
      formData.append('modelo',    this.pecaEditando.modelo!);
      formData.append('ano',       String(this.pecaEditando.ano));
      formData.append('marca',     String(this.pecaEditando.marca));
      formData.append('cor',       String(this.pecaEditando.cor));
      formData.append('tamanho',   String(this.pecaEditando.tamanho));
      formData.append('categoria', String(this.pecaEditando.categoria));
      formData.append('foto',      this.fotoNova);

      options = {
        headers: { 'Authorization': `Token ${this.usuario.token}` },
        url: `${environment.apiUrl}/peca/api/editar/${this.pecaEditandoId}/`,
        data: formData,
      };
    } else {
      options = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.usuario.token}`,
        },
        url: `${environment.apiUrl}/peca/api/editar/${this.pecaEditandoId}/`,
        data: {
          modelo:    this.pecaEditando.modelo,
          ano:       this.pecaEditando.ano,
          marca:     this.pecaEditando.marca,
          cor:       this.pecaEditando.cor,
          tamanho:   this.pecaEditando.tamanho,
          categoria: this.pecaEditando.categoria,
        },
      };
    }

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

  // ── Anunciar ──────────────────────────────────────────────────────────────
  abrirModalAnuncio(peca: Peca) {
    this.pecaSelecionada = peca;
    this.novoAnuncio = { titulo: '', descricao: '', preco: null };
    this.modalAnuncioAberto = true;
  }

  fecharModalAnuncio() {
    this.modalAnuncioAberto = false;
    this.pecaSelecionada = null;
    this.novoAnuncio = { titulo: '', descricao: '', preco: null };
  }

  async publicarAnuncio() {
    if (!this.pecaSelecionada) return;
    if (!this.novoAnuncio.titulo || !this.novoAnuncio.preco) {
      await this.apresenta_mensagem('Preencha título e preço.');
      return;
    }

    const loading = await this.controle_caregamento.create({ message: 'Publicando anúncio...' });
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
        peca:      this.pecaSelecionada.id,
      },
    };

    CapacitorHttp.post(options)
      .then(async (resposta: HttpResponse) => {
        if (resposta.status === 201) {
          await this.apresenta_mensagem('Anúncio publicado com sucesso!');
          this.fecharModalAnuncio();
        } else {
          await this.apresenta_mensagem(`Erro ao publicar: ${resposta.status}`);
        }
      })
      .catch(async (erro: any) => {
        console.error(erro);
        await this.apresenta_mensagem(`Erro de conexão: ${erro?.status ?? 'desconhecido'}`);
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

  // ── Toast ─────────────────────────────────────────────────────────────────
  async apresenta_mensagem(mensagem: any) {
    const toast = await this.controle_toast.create({
      message: typeof mensagem === 'string' ? mensagem : `Erro: ${mensagem}`,
      duration: 3000,
    });
    await toast.present();
  }
}
