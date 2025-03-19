/**
 * @name FullscreenToggle
 * @author programmer2514
 * @authorId 563652755814875146
 * @description A BetterDiscord plugin to easily make Discord fullscreen
 * @version 1.0.0
 * @donate https://ko-fi.com/benjaminpryor
 * @patreon https://www.patreon.com/BenjaminPryor
 * @website https://github.com/programmer2514/BetterDiscord-FullscreenToggle
 * @source https://github.com/programmer2514/BetterDiscord-FullscreenToggle/raw/refs/heads/main/FullscreenToggle.plugin.js
 */

// Abstract settings calls
const settings = {
  get fullscreenElement() { return this._fullscreenElement ?? (this._fullscreenElement = runtime.api.Data.load('fullscreen-element') ?? 'window-no-bar'); },
  set fullscreenElement(v) { runtime.api.Data.save('fullscreen-element', this._fullscreenElement = v); },

  get fullscreenElementCustom() { return this._fullscreenElementCustom ?? (this._fullscreenElementCustom = runtime.api.Data.load('fullscreen-element-custom') ?? ''); },
  set fullscreenElementCustom(v) { runtime.api.Data.save('fullscreen-element-custom', this._fullscreenElementCustom = v); },

  get keyboardShortcutEnabled() { return this._keyboardShortcutEnabled ?? (this._keyboardShortcutEnabled = runtime.api.Data.load('keyboard-shortcut-enabled') ?? true); },
  set keyboardShortcutEnabled(v) { runtime.api.Data.save('keyboard-shortcut-enabled', this._keyboardShortcutEnabled = v); },

  get toggled() { return this._toggled ?? (this._toggled = runtime.api.Data.load('toggled') ?? false); },
  set toggled(v) { runtime.api.Data.save('toggled', this._toggled = v); },

  get toggleShortcut() { return this._toggleShortcut ?? (this._toggleShortcut = new Set(runtime.api.Data.load('toggle-shortcut') ?? ['F11'])); },
  set toggleShortcut(v) {
    runtime.api.Data.save('toggle-shortcut', v);
    this._toggleShortcut = new Set(v);
  },
};

// Define plugin changelog and settings panel layout
const config = {
  changelog: [
    {
      title: '1.0.0',
      type: 'added',
      items: [
        'Initial release',
      ],
    },
  ],
  settings: [
    {
      type: 'dropdown',
      id: 'fullscreenElement',
      name: 'Fullscreen Element',
      note: 'The element to make fullscreen',
      get value() { return settings.fullscreenElement; },
      options: [
        {
          label: 'Window',
          value: 'window',
        },
        {
          label: 'Window (No top bar)',
          value: 'window-no-bar',
        },
        {
          label: 'Chat/Forum + Members List',
          value: 'chat-members',
        },
        {
          label: 'Chat',
          value: 'chat',
        },
        {
          label: 'Members List',
          value: 'members',
        },
        {
          label: 'Custom',
          value: 'custom',
        },
      ],
    },
    {
      type: 'text',
      id: 'fullscreenElementCustom',
      name: 'Custom Fullscreen Element',
      note: 'A CSS selector specifying the element to make fullscreen. Fullscreen Element must be set to "Custom"',
      placeholder: 'Ex: div.className > span#ID',
      get value() { return settings.fullscreenElementCustom },
    },
    {
      type: 'switch',
      id: 'keyboardShortcutEnabled',
      name: 'Keyboard Shortcut Enabled',
      get value() { return settings.keyboardShortcutEnabled; },
    },
    {
      type: 'keybind',
      id: 'toggleShortcut',
      name: 'Toggle Fullscreen - Keyboard Shortcut',
      get value() { return [...settings.toggleShortcut]; },
    },
  ],
};

// Define locale labels
const locale = {
  en: 'Toggle Fullscreen',
  get current() { return this[document.documentElement.getAttribute('lang')] ?? this.en; },
};

// Define icon paths
const icons = {
  enter: '<path fill="currentColor" d="M4 6c0-1.1.9-2 2-2h3a1 1 0 0 0 0-2H6a4 4 0 0 0-4 4v3a1 1 0 0 0 2 0V6ZM4 18c0 1.1.9 2 2 2h3a1 1 0 1 1 0 2H6a4 4 0 0 1-4-4v-3a1 1 0 1 1 2 0v3ZM18 4a2 2 0 0 1 2 2v3a1 1 0 1 0 2 0V6a4 4 0 0 0-4-4h-3a1 1 0 1 0 0 2h3ZM20 18a2 2 0 0 1-2 2h-3a1 1 0 1 0 0 2h3a4 4 0 0 0 4-4v-3a1 1 0 1 0-2 0v3Z"></path>',
  exit: '<path fill="currentColor" d="M8 6a2 2 0 0 1-2 2H3a1 1 0 0 0 0 2h3a4 4 0 0 0 4-4V3a1 1 0 0 0-2 0v3ZM8 18a2 2 0 0 0-2-2H3a1 1 0 1 1 0-2h3a4 4 0 0 1 4 4v3a1 1 0 1 1-2 0v-3ZM18 8a2 2 0 0 1-2-2V3a1 1 0 1 0-2 0v3a4 4 0 0 0 4 4h3a1 1 0 1 0 0-2h-3ZM16 18c0-1.1.9-2 2-2h3a1 1 0 1 0 0-2h-3a4 4 0 0 0-4 4v3a1 1 0 1 0 2 0v-3Z"></path>',
};

// Abstract webpack modules
const modules = {
  get members() { return this._members ?? (this._members = runtime.api.Webpack.getByKeys('membersWrap', 'hiddenMembers', 'roleIcon')); },
  get icons() { return this._icons ?? (this._icons = runtime.api.Webpack.getByKeys('selected', 'iconWrapper', 'clickable', 'icon')); },
  get dispatcher() { return this._dispatcher ?? (this._dispatcher = runtime.api.Webpack.getByKeys('dispatch', 'isDispatching')); },
  get toolbar() { return this._toolbar ?? (this._toolbar = runtime.api.Webpack.getByKeys('updateIconForeground', 'search', 'forumOrHome')); },
  get guilds() { return this._guilds ?? (this._guilds = runtime.api.Webpack.getByKeys('chatContent', 'noChat', 'parentChannelName', 'linkedLobby')); },
  get app() { return this._app ?? (this._app = runtime.api.Webpack.getByKeys('appAsidePanelWrapper', 'notAppAsidePanel', 'app', 'mobileApp')); },
};

// Declare runtime object structure
const runtime = {
  meta: null,
  api: null,
  keys: new Set(),
  lastKeypress: Date.now(),
  button: null,

  // Controls all event listeners
  get controller() {
    if (this._controller && this._controller.signal.aborted) this._controller = null;
    return this._controller ?? (this._controller = new AbortController());
  },
};

// Export plugin class
module.exports = class CollapsibleUI {
  // Get api and metadata
  constructor(meta) {
    runtime.meta = meta;
    runtime.api = new BdApi(runtime.meta.name);
  }

  // Initialize the plugin when it is enabled
  start = () => {
    // Show changelog modal if version has changed
    const savedVersion = runtime.api.Data.load('version');
    if (savedVersion !== runtime.meta.version) {
      runtime.api.UI.showChangelogModal(
        {
          title: runtime.meta.name,
          subtitle: runtime.meta.version,
          blurb: runtime.meta.description,
          changes: config.changelog,
        },
      );
      runtime.api.Data.save('version', runtime.meta.version);
    }

    // Subscribe listeners
    this.addListeners();

    // Initialize the plugin
    settings.toggled = false;
    this.createToolbarButton();
    runtime.api.Logger.info('Enabled');
  };

  // Restore the default UI when the plugin is disabled
  stop = () => {
    // Unsubscribe listeners
    runtime.controller.abort();

    // Terminate the plugin
    runtime.button.remove();
    runtime.api.Logger.info('Disabled');
  };

  // Re-inject the toolbar button when the page changes
  onSwitch = () => { this.createToolbarButton(); };

  // Build settings panel
  getSettingsPanel = () => {
    return runtime.api.UI.buildSettingsPanel(
      {
        settings: config.settings,
        onChange: (_, id, value) => {
          settings[id] = value;
          
          this.stop();
          this.start();
        },
      },
    );
  };

  // Create a functional toolbar button
  createToolbarButton = () => {
    // Get button text
    let text = locale.current + ' (' + [...settings.toggleShortcut].map(e => (e.length === 1 ? e.toUpperCase() : e)).join('+') + ')';

    // Create button and add it to the toolbar
    let button = BdApi.DOM.parseHTML(`
      <div id="fst-button" class="${modules.icons?.iconWrapper} ${modules.icons?.clickable}" role="button" aria-label="${text}" tabindex="0">
        <svg x="0" y="0" class="${modules.icons?.icon}" aria-hidden="false" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          ${(settings.toggled) ? icons.exit : icons.enter}
        </svg>
      </div>
    `, true);
    document.querySelector(`.${modules.icons?.toolbar}`).appendChild(button);

    // Remove old button and get new one
    runtime.button?.remove();
    runtime.button = document.querySelector(`#fst-button`);

    // Add tooltip and click handler
    runtime.api.UI.createTooltip(runtime.button, text, { side: 'left' });
    runtime.button.addEventListener('click', () => this.toggleFullscreen());
  };

  // Add event listeners to handle resize/expand on hover
  addListeners = () => {
    document.body.addEventListener('keydown', (e) => {
      // Handle keyboard shortcuts
      if (settings.keyboardShortcutEnabled) {
        // Clear old logged keypresses if necessary
        if (Date.now() - runtime.lastKeypress > 1000)
          runtime.keys.clear();
        runtime.lastKeypress = Date.now();

        // Log keypress
        runtime.keys.add(e.key);
        if (runtime.keys.symmetricDifference(settings.toggleShortcut).size === 0)
          this.toggleFullscreen();
      }
    }, { passive: true, signal: runtime.controller.signal });

    document.body.addEventListener('keyup', (e) => {
      // Delete logged keypress
      if (settings.keyboardShortcutEnabled)
        runtime.keys.delete(e.key);
    }, { passive: true, signal: runtime.controller.signal });

    this.getFullscreenElement()?.addEventListener('fullscreenchange', () => {
      if ((document.fullscreenElement && !settings.toggled) || (!document.fullscreenElement && settings.toggled)) {
        settings.toggled = !settings.toggled;
        if (runtime.button) runtime.button.querySelector(`svg`).innerHTML = (settings.toggled) ? icons.exit : icons.enter;
      }
    }, { passive: true, signal: runtime.controller.signal });
  };

  // Toggles the button at the specified index
  toggleFullscreen = () => {
    if (this.getFullscreenElement()) {
      if (!settings.toggled) this.getFullscreenElement()?.requestFullscreen();
      else if (document.fullscreenElement) document.exitFullscreen();
    }
  };

  // Get the element to make fullscreen
  getFullscreenElement = () => {
    switch (settings.fullscreenElement) {
      case 'window-no-bar':
        return document.querySelector(`.${modules.app?.appAsidePanelWrapper}`);
      case 'chat-members':
        return document.querySelector(`.${modules.guilds?.content}`);
      case 'chat':
        return document.querySelector(`.${modules.guilds?.chatContent}`);
      case 'members':
        return document.querySelector(`.${modules.members?.membersWrap}`);
      case 'custom':
        return document.querySelector(`${settings.fullscreenElementCustom}`);
      default:
        return document.body;
    }
  };
};
