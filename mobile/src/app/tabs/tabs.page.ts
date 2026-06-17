import { Component, OnInit } from '@angular/core';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel,
  AlertController, NavController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shirtOutline, addCircle, megaphoneOutline, logOutOutline } from 'ionicons/icons';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage implements OnInit {

  constructor(
    private storage: Storage,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
  ) {
    addIcons({ shirtOutline, addCircle, megaphoneOutline, logOutOutline });
  }

  async ngOnInit() {
    await this.storage.create();
  }

  navegarNovaPeca() {
    this.navCtrl.navigateForward('/nova-peca');
  }

  async confirmarLogout() {
    const alerta = await this.alertCtrl.create({
      header: 'Sair',
      message: 'Deseja realmente sair da sua conta?',
      cssClass: 'alerta-logout',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sair',
          role: 'destructive',
          handler: async () => {
            await this.storage.remove('usuario');
            this.navCtrl.navigateRoot('/home', { animationDirection: 'back' });
          },
        },
      ],
    });
    await alerta.present();
  }
}
