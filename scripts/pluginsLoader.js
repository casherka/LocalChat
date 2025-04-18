module.exports = class PluginsLoader {
    calculateSum(plugins, args, sum = []) {
        plugins.forEach((element) => {
            sum[element] = require("../plugins/" + element)
            sum[element].data = sum[element](args[element])
        })
        return sum
    }
    
    initPlugins(plugins, args, sum) {
        plugins.forEach((element) => {
            sum[element].serverInit(sum, args[element])
        })
    }
  
    loadPlugins(config) {
        this.sum = this.calculateSum(config.plugins, config.pluginsArgs)
        this.initPlugins(config.plugins, config.pluginsArgs, this.sum)
        console.log("\nloaded plugins:", Object.keys(this.sum))
    }
}