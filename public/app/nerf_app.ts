import {Component} from 'angular2/core';
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
    status: String = '';

    constructor() {
        this.con = new WebSocket();
        let self = this;
        this.con.socket.on('new_connection', function(status){
            self.motor = !!status.spinning;
            if (status.participant.id == '/#' + self.con.socket.id) {
                self.name = status.participant.name;
            }
            self.log('new_connection ' + JSON.stringify(status.participant));
        });
        this.con.socket.on('spun_up', function(status){
            self.motor = true;
            self.log('spun_up ' + JSON.stringify(status));
        });
        this.con.socket.on('spun_down', function(status){
            self.motor = false;
            self.log('spun_down ' + JSON.stringify(status));
        });
        this.con.socket.on('fired_on', function(status){
            self.log('fired_on ' + JSON.stringify(status));
        });
        this.con.socket.on('fired_off', function(status){
            self.log('fired_off ' + JSON.stringify(status));
        });
        this.con.socket.on('disconnected', function(status){
            self.log('disconnected ' + JSON.stringify(status.participant));
        });
    }

    fire(state: boolean) {
        if (this.motor) {
            this.con.socket.emit(state ? 'fire_on' : 'fire_off');
        }
    }

    spin() {
        this.con.socket.emit(!this.motor ? 'spin_up' : 'spin_down');
    }

    log(message) {
        // this is better, but it won't function in mobile safari
        // this.status = moment().format('HH:mm:ss') + ' ' + message + '\n' + this.status;
        this.status = message + '\n' + this.status;
    }
}
