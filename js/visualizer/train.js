Visualizer.prototype.Reset = function() {
    this.modelManager.Reset()
    this.optimizer.Reset()
}

Visualizer.prototype.GetTrainData = function() {
    let trainData = this.dataset.splits.train.data
    let backgroundData = this.compact.GetData(Math.floor(trainData.length * this.backgroundPart))
    let datas = [trainData, backgroundData]

    let length = trainData.length + backgroundData.length
    let inputs = new Float64Array(length * trainData.dimension)
    let outputs = new Float64Array(length)

    let indices = []

    for (let i = 0; i < backgroundData.length; i++)
        indices.push([1, i])

    for (let i = 0; i < trainData.length; i++)
        indices.push([0, i])

    random.Shuffle(indices)

    for (let i = 0; i < length; i++) {
        let data = datas[indices[i][0]]
        let index = indices[i][1]

        for (let j = 0; j < data.dimension; j++)
            inputs[i * data.dimension + j] = data.inputs[index * data.dimension + j]

        outputs[i] = data.outputs[index]
    }

    return new Data(inputs, outputs, trainData.dimension)
}

Visualizer.prototype.TrainStep = function() {
    let data = this.GetTrainData()
    this.modelManager.Train(data, this.batchSize, this.optimizer, this.criterion)
}
