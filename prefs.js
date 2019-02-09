const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

function init() {
}

var BitcoindMonitorPrefsWidget = new GObject.Class({
    Name: 'BitcoindMonitor.Prefs.Widget',
    GTypeName: 'BitcoindMonitorPrefs',
    Extends: Gtk.Grid,

    _init: function(params) {
        this.parent(params);
        this.margin = this.row_spacing = this.column_spacing = 20;

        this._settings = Convenience.getSettings();

        this.set_orientation(Gtk.Orientation.HORIZONTAL);
    
        this._addEntry(0, 0, 'rpchost', 'Rpc host:');
        this._addSpinButton(3, 0, 'rpcport', 'Rpc port:', 1, 65535);
        this._addEntry(0, 1, 'rpcuser', 'Rpc user:', { visibility: false });
        this._addEntry(3, 1, 'rpcpassword', 'Rpc password:', { visibility: false });
    },

    _addEntry: function(x, y, key, text, options = {}) {
        options['hexpand'] = true;
        let label = new Gtk.Label({ label: '<b>' + text + '</b>',
                                    use_markup: true,
                                    halign: Gtk.Align.END })
        this.attach(label, x, y, 1, 1);

        let entry = new Gtk.Entry(options);
        this.attach(entry, x+1, y, 1, 1);

        this._settings.bind(key, entry, 'text', Gio.SettingsBindFlags.DEFAULT);
    },

    _addSpinButton: function(x, y, key, text, from, to) {
        let label = new Gtk.Label({ label: '<b>' + text + '</b>',
                                    use_markup: true,
                                    halign: Gtk.Align.END })
        this.attach(label, x, y, 1, 1);

        let entry = Gtk.SpinButton.new_with_range (from, to, 1);
        this.attach(entry, x+1, y, 1, 1);

        this._settings.bind(key, entry, 'value', Gio.SettingsBindFlags.DEFAULT);
    }
});

function buildPrefsWidget() {
    let widget = new BitcoindMonitorPrefsWidget();
    widget.show_all();

    return widget;
}

