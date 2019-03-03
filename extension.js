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
        this.parent(St.Align.START, 'bitcoind-monitor');

        this._blockHeight = 0;
        this._targetBlockHeight = 0;

        this._settings = Convenience.getSettings();
        this._rpcUser = this._settings.get_string('rpcuser');
        this._rpcPassword = this._settings.get_string('rpcpassword');
        this._rpcHost = this._settings.get_string('rpchost');
        this._rpcPort = this._settings.get_int('rpcport');
        this._refreshInterval = this._settings.get_int('refreshinterval');

        this._addMainIndicator();
        this._addPopupMenu();

        this._updateGetNetworkInfo();
        this._updateGetBlockchainInfo();
        Mainloop.timeout_add_seconds(this._refreshInterval, Lang.bind(this, function() {
            this._updateGetBlockchainInfo();
        }));
    },

    _addMainIndicator: function() {
        let box = new St.BoxLayout();

        let icon = new St.Icon({ style_class: 'bitcoin-white' });
        this._blockHeightLabel = new St.Label({ text: '  unavailable ', y_expand: true, y_align: Clutter.ActorAlign.CENTER });
        box.add(icon);
        box.add(this._blockHeightLabel);
		box.add(PopupMenu.arrowIcon(St.Side.BOTTOM));

		this.actor.add_child(box);
    },

    _addPopupMenu: function() {
        this._versionLabel = this._addPopupMenuMetric('Version:', 'unavailable')
        this._peerConnectionCountLabel = this._addPopupMenuMetric('Peer connection count:', 'unavailable');
        this._lastBlockTimeLabel = this._addPopupMenuMetric('Last block time:', 'unavailable')
        this._addPopupMenuSeparator();
        this._addPopupMenuPrefLink();
    },

    _addPopupMenuSeparator: function() {
        let separator = new PopupMenu.PopupSeparatorMenuItem()
        this.menu.addMenuItem(separator);
        return separator
    },

    _addPopupMenuMetric: function(title, text) {
        let item = new PopupMenu.PopupBaseMenuItem();

        let titleLabel = new St.Label({ text: title });
        item.actor.add(titleLabel, { x_fill: true, expand: true });
        let valueLabel = new St.Label({ text: text });
        item.actor.add(valueLabel);

        this.menu.addMenuItem(item);

        return valueLabel;
    },

    _addPopupMenuPrefLink: function() {
        let item = new PopupMenu.PopupBaseMenuItem();
        item.actor.add(new St.Label({ text: _("Bitcoind monitor Settings") }), { expand: true, x_fill: false });

        item.connect('activate', function () {
            Util.spawn(["gnome-shell-extension-prefs", Me.metadata.uuid]);
        });

        this.menu.addMenuItem(item);
        return item
    },

    _updateGetBlockchainInfo: function() {
        let self = this
        let updateCallback = function(json) {
            let result = json.result;
            let blocks = result.blocks;
            let headers = result.headers;
            if (self._blockHeight < blocks || self._targetBlockHeight < headers) {
                self._blockHeight = blocks;
                self._targetBlockHeight = headers;

                self._blockHeightLabel.text = " " +
                    self._blockHeight.toString() +
                    " / " +
                    self._targetBlockHeight.toString();

                let date = new Date(result.mediantime*1000);
                self._lastBlockTimeLabel.text = date.toLocaleString();
            }
        };

        this._rpcRequest('{ "method": "getblockchaininfo" }', updateCallback);
    },

    _updateGetNetworkInfo: function() {
        let self = this
        let updateCallback = function(json) {
            let result = json.result;
            self._versionLabel.text = result.subversion;
            self._peerConnectionCountLabel.text = result.connections.toString();
        };

        this._rpcRequest('{ "method": "getnetworkinfo" }', updateCallback);
    },

    _rpcRequest: function(body, callback) {
        let message = Soup.Message.new('POST', 'http://' + this._rpcUser + ':' + this._rpcPassword + '@' + this._rpcHost + ':' + this._rpcPort.toString());
        message.set_request('application/json', 2, body);
        _httpSession.queue_message(message, function(session, message) {
            let root = JSON.parse(message.response_body.data);
            try {
                callback.call(this, root);
            } catch (e) {
                log('Failed to parse rpc response: ' + e.toString());
                log('Rpc response status_code: ' + message.status_code.toString());
                log('Rpc response body: ' + message.response_body.data);
            }
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
