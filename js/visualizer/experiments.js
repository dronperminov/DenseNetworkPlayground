Visualizer.prototype.GenerateSyntheticData = function(count) {
    let data = this.compact.GetData(count)
    let predictions = this.modelManager.model.PredictUnrolled(data.inputs, count)
    let length = 0

    for (let i = 0; i < count; i++) {
        let label = this.thresholds.GetLabel(predictions[i])

        if (label == 0 || Math.random() > Math.abs(predictions[i]))
            continue

        for (let j = 0; j < data.dimension; j++)
            data.inputs[length * data.dimension + j] = data.inputs[i * data.dimension + j]

        data.outputs[length++] = label
    }

    data.length = length
    data.inputs = new Float64Array(data.inputs.buffer, 0, data.dimension * length)
    data.outputs = new Float64Array(data.outputs.buffer, 0, length)

    return data
}
