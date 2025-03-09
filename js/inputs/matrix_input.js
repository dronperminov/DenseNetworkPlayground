class MatrixInput {
    constructor(dimension, parent) {
        this.dimension = dimension
        this.inputs = new Array(dimension[0])

        let div = MakeElement(parent, {class: "matrix-input"})

        for (let i = 0; i < dimension[0]; i++) {
            let row = MakeElement(div, {class: "matrix-input-row"})

            this.inputs[i] = []
            for (let j = 0; j < dimension[1]; j++) {
                let input = MakeElement(row, {class: "basic-input", type: "number", value: "0"}, "input")
                this.inputs[i].push(new NumberInput(input))
            }
        }
    }

    GetValue() {
        let matrix = []

        for (let i = 0; i < this.dimension[0]; i++) {
            matrix[i] = []

            for (let j = 0; j < this.dimension[1]; j++)
                matrix[i][j] = this.inputs[i][j].GetValue()
        }

        return matrix
    }

    SetValue(matrix) {
        for (let i = 0; i < this.dimension[0]; i++)
            for (let j = 0; j < this.dimension[1]; j++)
                this.inputs[i][j].SetValue(matrix[i][j])
    }
}
