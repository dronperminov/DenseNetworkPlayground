class VectorInput {
    constructor(dimension, parent) {
        this.dimension = dimension
        this.inputs = []

        let div = MakeElement(parent, {class: "vector-input"})
        let inputs = MakeElement(div, {class: "vector-input-inputs"})

        for (let i = 0; i < dimension; i++) {
            let input = MakeElement(inputs, {class: "basic-input", type: "number", value: "0"}, "input")
            this.inputs.push(new NumberInput(input))
        }
    }

    GetValue() {
        let vector = []

        for (let i = 0; i < this.dimension; i++)
            vector.push(this.inputs[i].GetValue())

        return vector
    }

    SetValue(vector) {
        for (let i = 0; i < this.dimension; i++)
            this.inputs[i].SetValue(vector[i])
    }
}
