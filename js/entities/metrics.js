class Metrics extends EventEmitter {
    constructor() {
        super()
        this.metrics = {}
    }

    Add(metric, names) {
        this.metrics[metric] = {}

        for (let name of names)
            this.metrics[metric][name] = []
    }

    Reset() {
        for (let metric of Object.keys(this.metrics))
            for (let name of Object.keys(this.metrics[metric]))
                this.metrics[metric][name] = []

        this.emit("reset")
    }

    Set(metric, name, epoch, value) {
        this.metrics[metric][name][epoch] = value
        this.emit("change", metric, name, epoch, value)
    }
}
