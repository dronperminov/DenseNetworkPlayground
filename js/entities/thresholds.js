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

    GetLabel(value) {
        if (value < this.low)
            return -1

        if (value >= this.high)
            return 1

        return 0
    }

    GetOutputColor(output, mode) {
        if (this.IsInside(output))
            return [255, 255, 255]

        let color = output < 0 ? [118, 153, 212] : [221, 115, 115]
        let value = Math.abs(output)

        if (mode == "discrete") {
            value = this.DiscreteValue(value, 1)
        }
        else if (mode == "discrete-2") {
            value = this.DiscreteValue(value, 2)
        }
        else if (mode == "discrete-4") {
            value = this.DiscreteValue(value, 4)
        }
        else if (mode == "discrete-10") {
            value = this.DiscreteValue(value, 10)
        }

        return this.MixColor(color, [255, 255, 255], value)
    }

    DiscreteValue(value, levels) {
        return (Math.round(value * levels) + 1) / levels
    }

    MixColor(color1, color2, t) {
        t = Math.max(0, Math.min(1, t))

        return [
            Math.floor(color1[0] * t + color2[0] * (1 - t)),
            Math.floor(color1[1] * t + color2[1] * (1 - t)),
            Math.floor(color1[2] * t + color2[2] * (1 - t))
        ]
    }
}
