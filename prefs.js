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
    
        this._addPasswordEntry('rpcuser', 'Rpc user:');
        this._addPasswordEntry('rpcpassword', 'Rpc password:');
    },

    _addPasswordEntry: function(key, label) {
        this.add(new Gtk.Label({ label: '<b>' + label + '</b>',
                                 use_markup: true,
                                 halign: Gtk.Align.END }));
        entry = new Gtk.Entry({ hexpand: true, visibility: false });
        this.add(entry);
        this._settings.bind(key, entry, 'text', Gio.SettingsBindFlags.DEFAULT);
    }
});

function buildPrefsWidget() {
    let widget = new BitcoindMonitorPrefsWidget();
    widget.show_all();

    return widget;
}

