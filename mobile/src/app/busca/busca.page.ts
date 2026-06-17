import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonSearchbar, IonChip, IonLabel, IonIcon, IonSpinner, IonItem,
  ActionSheetController, NavController,
} from '@ionic/angular/standalone';
import { CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';
import { Peca } from '../pecas/pecas.model';
import { Storage } from '@ionic/storage-angular';
import { Usuario } from '../home/usuario.model';
import { OPCOES_MARCA, OPCOES_COR, OPCOES_TAMANHO, OPCOES_CATEGORIA } from '../pecas/pecas.consts';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-busca',
  templateUrl: 'busca.page.html',
  styleUrls: ['busca.page.scss'],
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonSearchbar, IonChip, IonLabel, IonIcon, IonSpinner, IonItem,
  ],
})
export class BuscaPage implements OnInit {
  pecas: Peca[] = [];
  carregando = true;
  usuario!: Usuario;
  fotosSrc: { [id: number]: string } = {};

  textoBusca = '';
  filtroCategoria: number | null = null;
  filtroMarca: number | null = null;
  filtroTamanho: number | null = null;
  filtroCor: number | null = null;

  constructor(
    public storage: Storage,
    public controle_navegacao: NavController,
    public actionSheetCtrl: ActionSheetController,
  ) {}

  async ngOnInit() {
    await this.storage.create();
    const registro = await this.storage.get('usuario');
    if (registro) {
      this.usuario = Object.assign(new Usuario(), registro);
      await this.carregarPecas();
    } else {
      this.controle_navegacao.navigateRoot('/home');
    }
  }

  async ionViewWillEnter() {
    if (this.usuario?.token) {
      await this.carregarPecas();
    }
  }

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
    const configs = {
      categoria: { opcoes: OPCOES_CATEGORIA, header: 'Categoria' },
      marca:     { opcoes: OPCOES_MARCA,     header: 'Marca'     },
      tamanho:   { opcoes: OPCOES_TAMANHO,   header: 'Tamanho'   },
      cor:       { opcoes: OPCOES_COR,        header: 'Cor'       },
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

  private async carregarPecas() {
    this.carregando = true;
    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.usuario.token}`,
      },
      url: `${environment.apiUrl}/peca/api/listar/`,
    };

    try {
      const resposta: HttpResponse = await CapacitorHttp.get(options);
      if (resposta.status === 200) {
        this.pecas = resposta.data;
        this.fotosSrc = {};
        this.pecas.forEach(p => this.carregarFoto(p));
      }
    } catch (erro) {
      console.error('Erro ao carregar peças na busca:', erro);
    } finally {
      this.carregando = false;
    }
  }

  private carregarFoto(peca: Peca) {
    if (!peca.foto || this.fotosSrc[peca.id]) return;
    const options: HttpOptions = {
      headers: { 'Authorization': `Token ${this.usuario.token}` },
      url: `${environment.apiUrl}/peca/api/foto/${peca.id}/`,
      responseType: 'blob',
    };
    CapacitorHttp.get(options)
      .then((r: HttpResponse) => {
        if (r.status === 200 && r.data) {
          this.fotosSrc[peca.id] = `data:image/jpeg;base64,${r.data}`;
        }
      })
      .catch(e => console.error(`Erro ao carregar foto ${peca.id}:`, e));
  }
}
