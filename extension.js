const Me = imports.misc.extensionUtils.getCurrentExtension();
const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const Util = imports.misc.util;
const Clutter = imports.gi.Clutter;
const Mainloop = imports.mainloop;
const Convenience = Me.imports.convenience;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const _httpSession = new Soup.SessionAsync();

var BitcoinMonitorButton = new Lang.Class({
    Name: 'BitcoinMonitorButton',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0, 'bitcoind-monitor', false);

        this._settings = Convenience.getSettings();
        this._rpcUser = this._settings.get_string('rpcuser');
        this._rpcPassword = this._settings.get_string('rpcpassword');
        this._rpcHost = this._settings.get_string('rpchost');
        this._rpcPort = this._settings.get_int('rpcport');
        this._refreshInterval = this._settings.get_int('refreshinterval');

        let box = new St.BoxLayout();

        let icon = new St.Icon({ style_class: 'bitcoin-white' });
        let label = new St.Label({ text: '  unavailable ', y_expand: true, y_align: Clutter.ActorAlign.CENTER });
        box.add(icon);
        box.add(label);
		box.add(PopupMenu.arrowIcon(St.Side.BOTTOM));

		this.actor.add_child(box);

        let item = new PopupMenu.PopupBaseMenuItem();
        item.actor.add(new St.Label({ text: _("Bitcoind monitor Settings") }), { expand: true, x_fill: false });

        item.connect('activate', function () {
            Util.spawn(["gnome-shell-extension-prefs", Me.metadata.uuid]);
        });

        this.menu.addMenuItem(item);

        let uiUpdateCallback = function(json) {
            let result = json.result;
            let blocks = result.blocks;
            label.text = "  " + blocks.toString() + "";
        };

        this._queryBitcoind(uiUpdateCallback);
        Mainloop.timeout_add_seconds(this._refreshInterval, Lang.bind(this, function() {
            this._queryBitcoind(uiUpdateCallback);
        }));
    },

    _queryBitcoind: function(callback) {
        let message = Soup.Message.new('POST', 'http://' + this._rpcUser + ':' + this._rpcPassword + '@' + this._rpcHost + ':' + this._rpcPort.toString());
        let body = '{ "method": "getblockchaininfo" }';
        message.set_request('application/json', 2, body);
        _httpSession.queue_message(message, function(session, message) {
            let root = JSON.parse(message.response_body.data);
            callback.call(this, root);
        });
    }
});

let bitcoindMonitorMenu;

function init() {
    log('bitcoind-monitor initialized');
}

function enable() {
    log('bitcoind-monitor enabled');

    bitcoindMonitorMenu = new BitcoinMonitorButton();
    Main.panel._addToPanelBox('HelloWorld', bitcoindMonitorMenu, 1, Main.panel._rightBox);
}

function disable() {
    log('bitcoind-monitor disabled');

    bitcoindMonitorMenu.destroy();
    bitcoindMonitorMenu = null;
}
