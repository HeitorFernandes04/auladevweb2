import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import {
  LoadingController, NavController, AlertController,
  ToastController, ActionSheetController,
} from '@ionic/angular/standalone';
import { AnunciosPage } from './anuncios.page';
import { Anuncio } from './anuncios.model';
import { Peca } from '../pecas/pecas.model';

function criarAnuncio(overrides: Partial<Anuncio> = {}): Anuncio {
  return Object.assign(new Anuncio(), {
    id: 1, titulo: 'Anuncio Teste', nome_peca: 'Peça Teste', nome_marca: 'Marca Teste',
    marca: 1, cor: 1, tamanho: 1, categoria: 1, usuario_id: 1,
    ...overrides,
  });
}

describe('AnunciosPage', () => {
  let component: AnunciosPage;
  let fixture: ComponentFixture<AnunciosPage>;

  beforeEach(async () => {
    const storageSpy = jasmine.createSpyObj('Storage', ['create', 'get', 'set']);
    const loadingSpy = jasmine.createSpyObj('LoadingController', ['create']);
    const navSpy     = jasmine.createSpyObj('NavController', ['navigateRoot']);
    const alertSpy   = jasmine.createSpyObj('AlertController', ['create']);
    const toastSpy   = jasmine.createSpyObj('ToastController', ['create']);
    const sheetSpy   = jasmine.createSpyObj('ActionSheetController', ['create']);

    storageSpy.create.and.returnValue(Promise.resolve());
    storageSpy.get.and.returnValue(Promise.resolve(null));

    const loadingElSpy = jasmine.createSpyObj('HTMLIonLoadingElement', ['present', 'dismiss']);
    loadingElSpy.present.and.returnValue(Promise.resolve());
    loadingElSpy.dismiss.and.returnValue(Promise.resolve());
    loadingSpy.create.and.returnValue(Promise.resolve(loadingElSpy));

    const toastElSpy = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    toastElSpy.present.and.returnValue(Promise.resolve());
    toastSpy.create.and.returnValue(Promise.resolve(toastElSpy));

    await TestBed.configureTestingModule({
      imports: [AnunciosPage],
      providers: [
        { provide: Storage,               useValue: storageSpy },
        { provide: LoadingController,     useValue: loadingSpy },
        { provide: NavController,         useValue: navSpy },
        { provide: AlertController,       useValue: alertSpy },
        { provide: ToastController,       useValue: toastSpy },
        { provide: ActionSheetController, useValue: sheetSpy },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AnunciosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── anunciosFiltrados — sem filtros ───────────────────────────────────────

  it('anunciosFiltrados — sem filtros retorna todos', () => {
    const a1 = criarAnuncio({ id: 1, titulo: 'Jaqueta Nike' });
    const a2 = criarAnuncio({ id: 2, titulo: 'Tênis Adidas', marca: 2 });
    component.anuncios = [a1, a2];
    expect(component.anunciosFiltrados.length).toBe(2);
  });

  // ── anunciosFiltrados — filtro por texto ──────────────────────────────────

  it('anunciosFiltrados — filtra por título', () => {
    component.anuncios = [
      criarAnuncio({ id: 1, titulo: 'Jaqueta Nike' }),
      criarAnuncio({ id: 2, titulo: 'Tênis Adidas', marca: 2 }),
    ];
    component.textoBusca = 'Jaqueta';
    expect(component.anunciosFiltrados.length).toBe(1);
    expect(component.anunciosFiltrados[0].titulo).toBe('Jaqueta Nike');
  });

  it('anunciosFiltrados — filtra por nome_peca', () => {
    component.anuncios = [
      criarAnuncio({ id: 1, nome_peca: 'Suéter' }),
      criarAnuncio({ id: 2, nome_peca: 'Calça', marca: 2 }),
    ];
    component.textoBusca = 'Suéter';
    expect(component.anunciosFiltrados.length).toBe(1);
    expect(component.anunciosFiltrados[0].nome_peca).toBe('Suéter');
  });

  it('anunciosFiltrados — filtra por nome_marca', () => {
    component.anuncios = [
      criarAnuncio({ id: 1, nome_marca: 'Nike' }),
      criarAnuncio({ id: 2, nome_marca: 'Adidas', marca: 2 }),
    ];
    component.textoBusca = 'Nike';
    expect(component.anunciosFiltrados.length).toBe(1);
    expect(component.anunciosFiltrados[0].nome_marca).toBe('Nike');
  });

  it('anunciosFiltrados — filtro por texto sem resultado', () => {
    component.anuncios = [criarAnuncio({ id: 1, titulo: 'Jaqueta Nike' })];
    component.textoBusca = 'inexistente';
    expect(component.anunciosFiltrados.length).toBe(0);
  });

  // ── anunciosFiltrados — filtros por campo ─────────────────────────────────

  it('anunciosFiltrados — filtra por marca', () => {
    component.anuncios = [
      criarAnuncio({ id: 1, marca: 1 }),
      criarAnuncio({ id: 2, marca: 2 }),
    ];
    component.filtroMarca = 1;
    expect(component.anunciosFiltrados.length).toBe(1);
    expect(component.anunciosFiltrados[0].marca).toBe(1);
  });

  it('anunciosFiltrados — filtra por cor', () => {
    component.anuncios = [
      criarAnuncio({ id: 1, cor: 1 }),
      criarAnuncio({ id: 2, cor: 2 }),
    ];
    component.filtroCor = 2;
    expect(component.anunciosFiltrados.length).toBe(1);
    expect(component.anunciosFiltrados[0].cor).toBe(2);
  });

  it('anunciosFiltrados — filtra por tamanho', () => {
    component.anuncios = [
      criarAnuncio({ id: 1, tamanho: 1 }),
      criarAnuncio({ id: 2, tamanho: 3 }),
    ];
    component.filtroTamanho = 3;
    expect(component.anunciosFiltrados.length).toBe(1);
    expect(component.anunciosFiltrados[0].tamanho).toBe(3);
  });

  it('anunciosFiltrados — filtra por categoria', () => {
    component.anuncios = [
      criarAnuncio({ id: 1, categoria: 1 }),
      criarAnuncio({ id: 2, categoria: 2 }),
    ];
    component.filtroCategoria = 1;
    expect(component.anunciosFiltrados.length).toBe(1);
    expect(component.anunciosFiltrados[0].categoria).toBe(1);
  });

  it('anunciosFiltrados — múltiplos filtros aplicam interseção', () => {
    component.anuncios = [
      criarAnuncio({ id: 1, marca: 1, cor: 1 }),
      criarAnuncio({ id: 2, marca: 1, cor: 2 }),
      criarAnuncio({ id: 3, marca: 2, cor: 1 }),
    ];
    component.filtroMarca = 1;
    component.filtroCor   = 1;
    expect(component.anunciosFiltrados.length).toBe(1);
    expect(component.anunciosFiltrados[0].id).toBe(1);
  });

  // ── temFiltroAtivo ────────────────────────────────────────────────────────

  it('temFiltroAtivo — false quando todos os filtros são nulos', () => {
    component.filtroMarca     = null;
    component.filtroCor       = null;
    component.filtroTamanho   = null;
    component.filtroCategoria = null;
    expect(component.temFiltroAtivo).toBeFalse();
  });

  it('temFiltroAtivo — true quando qualquer filtro está ativo', () => {
    component.filtroMarca = 1;
    expect(component.temFiltroAtivo).toBeTrue();
  });

  // ── limparFiltros ─────────────────────────────────────────────────────────

  it('limparFiltros — zera todos os campos de filtro e busca', () => {
    component.filtroMarca     = 1;
    component.filtroCor       = 2;
    component.filtroTamanho   = 3;
    component.filtroCategoria = 1;
    component.textoBusca      = 'Nike';
    component.limparFiltros();
    expect(component.filtroMarca).toBeNull();
    expect(component.filtroCor).toBeNull();
    expect(component.filtroTamanho).toBeNull();
    expect(component.filtroCategoria).toBeNull();
    expect(component.textoBusca).toBe('');
  });

  // ── editarAnuncio / fecharModal ───────────────────────────────────────────

  it('editarAnuncio — popula anuncioEditando e abre modal', () => {
    const anuncio = criarAnuncio({ id: 5, titulo: 'Jaqueta', descricao: 'Ótimo estado', preco: 150 });
    component.editarAnuncio(anuncio);
    expect(component.anuncioEditandoId).toBe(5);
    expect(component.anuncioEditando.titulo).toBe('Jaqueta');
    expect(component.anuncioEditando.descricao).toBe('Ótimo estado');
    expect(component.anuncioEditando.preco).toBe(150);
    expect(component.modalAberto).toBeTrue();
  });

  it('fecharModal — limpa estado do modal de edição', () => {
    component.modalAberto       = true;
    component.anuncioEditandoId = 5;
    component.anuncioEditando   = { titulo: 'Jaqueta' };
    component.fecharModal();
    expect(component.modalAberto).toBeFalse();
    expect(component.anuncioEditandoId).toBeNull();
    expect(component.anuncioEditando).toEqual({});
  });

  // ── modal de criação (2 etapas) ───────────────────────────────────────────

  it('selecionarPecaCriar — seleciona peça e avança para etapa preencher', () => {
    const peca = Object.assign(new Peca(), { id: 3, modelo: 'Suéter' });
    component.selecionarPecaCriar(peca);
    expect(component.pecaSelecionadaCriar).toBe(peca);
    expect(component.etapaCriar).toBe('preencher');
  });

  it('voltarParaSelecao — reseta etapa e peça selecionada', () => {
    component.etapaCriar = 'preencher';
    component.pecaSelecionadaCriar = Object.assign(new Peca(), { id: 3 });
    component.voltarParaSelecao();
    expect(component.etapaCriar).toBe('selecionar');
    expect(component.pecaSelecionadaCriar).toBeNull();
  });

  it('fecharModalCriar — limpa todo o estado do modal de criação', () => {
    component.modalCriarAberto      = true;
    component.etapaCriar            = 'preencher';
    component.pecaSelecionadaCriar  = Object.assign(new Peca(), { id: 3 });
    component.novoAnuncio           = { titulo: 'Draft', descricao: 'Desc', preco: 50 };
    component.fecharModalCriar();
    expect(component.modalCriarAberto).toBeFalse();
    expect(component.etapaCriar).toBe('selecionar');
    expect(component.pecaSelecionadaCriar).toBeNull();
    expect(component.novoAnuncio.titulo).toBe('');
    expect(component.novoAnuncio.preco).toBeNull();
  });
});
