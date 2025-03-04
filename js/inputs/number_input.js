class NumberInput extends EventEmitter {
    constructor(input) {
        super()

        this.input = input
        this.min = input.hasAttribute("min") ? +input.getAttribute("min") : null
        this.max = input.hasAttribute("max") ? +input.getAttribute("max") : null

        this.input.addEventListener("input", () => this.Input())
        this.input.addEventListener("change", () => this.Change())
    }

    GetValue() {
        let value = +this.input.value

        if (this.min !== null && value < this.min)
            value = this.min

        if (this.max !== null && value > this.max)
            value = this.max

        return value
    }

    SetValue(value) {
        this.input.value = value
    }

    Change() {
        let value = this.GetValue()
        this.input.value = value
        this.emit("change", value)
    }

    Input() {
        this.emit("input", this.GetValue())
    }
}
