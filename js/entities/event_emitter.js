class EventEmitter {
    constructor() {
        this.events = {}
    }

    on(event, listener) {
        if (!this.events[event])
            this.events[event] = []

        this.events[event].push(listener)
    }

    emit(event, ...args) {
        if (!this.events[event])
            return

        for (let listener of this.events[event])
            listener(...args)
    }
}
