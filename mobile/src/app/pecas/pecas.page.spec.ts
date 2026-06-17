import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import {
  LoadingController, NavController, AlertController,
  ToastController, ActionSheetController,
} from '@ionic/angular/standalone';
import { PecasPage } from './pecas.page';
import { Peca } from './pecas.model';

describe('PecasPage', () => {
  let component: PecasPage;
  let fixture: ComponentFixture<PecasPage>;

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
      imports: [PecasPage],
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

    fixture = TestBed.createComponent(PecasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── editarPeca / fecharModal ───────────────────────────────────────────────

  it('editarPeca — popula pecaEditando e abre modal', () => {
    const peca = Object.assign(new Peca(), {
      id: 7, modelo: 'Suéter', ano: 2022, marca: 1, cor: 2, tamanho: 1, categoria: 3,
    });
    component.editarPeca(peca);
    expect(component.pecaEditandoId).toBe(7);
    expect(component.pecaEditando.modelo).toBe('Suéter');
    expect(component.pecaEditando.ano).toBe(2022);
    expect(component.pecaEditando.marca).toBe(1);
    expect(component.modalAberto).toBeTrue();
  });

  it('fecharModal — limpa estado do modal de edição', () => {
    component.modalAberto    = true;
    component.pecaEditandoId = 7;
    component.pecaEditando   = { modelo: 'Suéter' };
    component.fotoNova       = new File([], 'foto.jpg');
    component.fecharModal();
    expect(component.modalAberto).toBeFalse();
    expect(component.pecaEditandoId).toBeNull();
    expect(component.pecaEditando).toEqual({});
    expect(component.fotoNova).toBeNull();
  });

  // ── modal de anúncio ──────────────────────────────────────────────────────

  it('abrirModalAnuncio — seleciona peça e abre modal com novoAnuncio zerado', () => {
    const peca = Object.assign(new Peca(), { id: 4, modelo: 'Jaqueta' });
    component.novoAnuncio = { titulo: 'rascunho', descricao: 'Desc', preco: 50 };
    component.abrirModalAnuncio(peca);
    expect(component.pecaSelecionada).toBe(peca);
    expect(component.novoAnuncio.titulo).toBe('');
    expect(component.novoAnuncio.preco).toBeNull();
    expect(component.modalAnuncioAberto).toBeTrue();
  });

  it('fecharModalAnuncio — limpa estado do modal de anúncio', () => {
    component.modalAnuncioAberto = true;
    component.pecaSelecionada    = Object.assign(new Peca(), { id: 4 });
    component.novoAnuncio        = { titulo: 'Jaqueta', descricao: 'Desc', preco: 100 };
    component.fecharModalAnuncio();
    expect(component.modalAnuncioAberto).toBeFalse();
    expect(component.pecaSelecionada).toBeNull();
    expect(component.novoAnuncio.titulo).toBe('');
    expect(component.novoAnuncio.preco).toBeNull();
  });
});
