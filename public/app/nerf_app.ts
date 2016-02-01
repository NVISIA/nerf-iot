import {Component} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';
import {WebSocket} from './socket';

@Component({
    selector: 'nerf-app',
    templateUrl: 'app/nerf_app.html'
})
export class NerfApp {
    name: string = '';
    con: WebSocket;
    motor: boolean = false;
    message: String = 'off';

    constructor() {
        this.con = new WebSocket();
        let self = this;
        this.con.socket.on('new_connection', function(status){
            self.motor = !!status.spinning;
        });
        this.con.socket.on('spun_up', function(status){
            self.motor = true;
        });
        this.con.socket.on('spun_down', function(status){
            self.motor = false;
        });
    }

    fire(state: boolean) {
        if (this.motor) {
            this.con.socket.emit(state ? 'fire_on' : 'fire_off');
            console.log('fire: ', state);
        }
    }

    spin() {
        console.log('spin: ', !this.motor);
        this.con.socket.emit(!this.motor ? 'spin_up' : 'spin_down');
    }
}
