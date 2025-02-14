class Thresholds extends EventEmitter {
    constructor(low = 0, high = 0) {
        super()

        this.low = low
        this.high = high
    }

    SetLow(low) {
        this.low = low
        this.emit("change", this.low, this.high)
    }

    SetHigh(high) {
        this.high = high
        this.emit("change", this.low, this.high)
    }

    Set(low, high) {
        this.low = low
        this.high = high
        this.emit("change", this.low, this.high)
    }

    IsInside(value) {
        return this.low <= value && value < this.high
    }
}
