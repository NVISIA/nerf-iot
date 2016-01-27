import {Component} from '../lib/npm/angular2@2.0.0-beta.1/core';
import {MATERIAL_DIRECTIVES} from '../lib/npm/ng2-material@0.1.8/all';
import {WebSocket} from './socket';

@Component({
    selector: 'my-app',
    templateUrl: '../view/app.component.html',
  directives: [MATERIAL_DIRECTIVES]
})
export class AppComponent {
    con: WebSocket;
    constructor() {
        // instantiate socket
    }

    fire(state: boolean) {

    }

    run(state: boolean) {

    }
}
