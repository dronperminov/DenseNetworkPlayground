class RangeInput extends EventEmitter {
    constructor(input, label) {
        super()

        this.input = input
        this.label = label

        this.input.addEventListener("input", () => this.Change())
    }

    Change() {
        let value = +this.input.value
        this.label.innerText = value
        this.emit("change", value)
    }
}
