class PointInput extends EventEmitter {
    constructor(div) {
        super()

        this.div = div
        this.axes = [0, 1]
        this.inputs = []
    }

    Build() {
        while (this.div.children.length > this.dimension) {
            this.div.lastChild.remove()
            this.inputs.pop()
        }

        while (this.div.children.length < this.dimension) {
            let input = MakeInput(this.div, `x<sub>${this.div.children.length + 1}</sub>`, {type: "number", step: 0.001, value: 0})
            let number = new NumberInput(input)
            number.on("change", () => this.Change())

            this.inputs.push(number)
        }
    }

    SetAxes(axisX, axisY) {
        this.axes[0] = axisX
        this.axes[1] = axisY
        this.UpdateAxesInputs()
    }

    SetDimension(dimension) {
        this.dimension = dimension
        this.point = new Float64Array(dimension)

        this.Build()
        this.UpdateAxesInputs()
    }

    Change() {
        for (let i = 0; i < this.dimension; i++)
            this.point[i] = this.inputs[i].GetValue()

        this.emit("change", this.point)
    }

    UpdateAxesInputs() {
        for (let i = 0; i < this.dimension; i++) {
            if (i == this.axes[0] || i == this.axes[1])
                this.div.children[i].classList.add("hidden")
            else
                this.div.children[i].classList.remove("hidden")
        }

        if (this.dimension == 2 && this.axes[0] != this.axes[1])
            this.div.parentNode.classList.add("hidden")
        else
            this.div.parentNode.classList.remove("hidden")
    }
}
