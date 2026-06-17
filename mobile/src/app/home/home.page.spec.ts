import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage-angular';
import {
  LoadingController, NavController, AlertController, ToastController,
} from '@ionic/angular/standalone';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let loadingSpy: jasmine.SpyObj<LoadingController>;
  let toastSpy: jasmine.SpyObj<ToastController>;

  beforeEach(async () => {
    const storageSpy = jasmine.createSpyObj('Storage', ['create', 'get', 'set']);
    loadingSpy      = jasmine.createSpyObj('LoadingController', ['create']);
    const navSpy    = jasmine.createSpyObj('NavController', ['navigateRoot']);
    const alertSpy  = jasmine.createSpyObj('AlertController', ['create']);
    toastSpy        = jasmine.createSpyObj('ToastController', ['create']);

    storageSpy.create.and.returnValue(Promise.resolve());
    storageSpy.get.and.returnValue(Promise.resolve(null));

    const toastElSpy = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    toastElSpy.present.and.returnValue(Promise.resolve());
    toastSpy.create.and.returnValue(Promise.resolve(toastElSpy));

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        { provide: Storage,           useValue: storageSpy },
        { provide: LoadingController, useValue: loadingSpy },
        { provide: NavController,     useValue: navSpy },
        { provide: AlertController,   useValue: alertSpy },
        { provide: ToastController,   useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('login — campos vazios não disparam requisição', async () => {
    spyOn(component, 'apresenta_mensagem');
    component.username = '';
    component.password = '';
    await component.login();
    expect(component.apresenta_mensagem).toHaveBeenCalledWith('Preencha usuário e senha.');
    expect(loadingSpy.create).not.toHaveBeenCalled();
  });

  it('login — só username preenchido não dispara requisição', async () => {
    spyOn(component, 'apresenta_mensagem');
    component.username = 'admin';
    component.password = '';
    await component.login();
    expect(component.apresenta_mensagem).toHaveBeenCalledWith('Preencha usuário e senha.');
    expect(loadingSpy.create).not.toHaveBeenCalled();
  });
});
