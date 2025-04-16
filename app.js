const config = require('./config.json');
const PluginsLoader = require("./scripts/pluginsLoader.js")

// Загрузка плагинов
const pluginsLoader = new PluginsLoader()
pluginsLoader.loadPlugins(config)