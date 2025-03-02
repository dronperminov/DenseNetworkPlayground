Visualizer.prototype.Reset = function(disabled) {
    this.epoch = 0
    this.optimizer.Reset()
    this.metrics.Reset()
    this.modelManager.Reset(disabled)
}

Visualizer.prototype.GetTrainData = function() {
    let trainData = this.dataset.splits.train.data
    let backgroundData = this.compact.GetData(Math.floor(trainData.length * this.backgroundPart))
    let datas = [trainData, backgroundData]

    let length = trainData.length + backgroundData.length
    let inputs = new Float64Array(length * trainData.dimension)
    let outputs = new Float64Array(length)

    let indices = []

    for (let index = 0; index < datas.length; index++)
        for (let i = 0; i < datas[index].length; i++)
            indices.push([index, i])

    Random.Shuffle(indices)

    for (let i = 0; i < length; i++) {
        let data = datas[indices[i][0]]
        let index = indices[i][1]

        for (let j = 0; j < data.dimension; j++)
            inputs[i * data.dimension + j] = data.inputs[index * data.dimension + j]

        outputs[i] = data.outputs[index]
    }

    return {
        train: new Data(inputs, outputs, trainData.dimension),
        background: backgroundData
    }
}

Visualizer.prototype.TrainStep = function() {
    let data = this.GetTrainData()

    this.epoch++
    this.dataset.SetData("background", data.background, {withStatistics: false})
    this.modelManager.Train(data.train, this.batchSize, this.optimizer, this.criterion)
}

Visualizer.prototype.EvaluateMetricsOnData = function(data, predictions) {
    let error = 0
    let refuse = 0
    let total = 0

    for (let i = 0; i < data.length; i++) {
        let prediction = this.thresholds.GetLabel(predictions[i])

        if (prediction == 0) {
            refuse++
            continue
        }

        total++
        error += prediction != this.thresholds.GetLabel(data.outputs[i])
    }

    return {
        loss: this.criterion.EvaluateUnrolled(predictions, data.outputs, data.length) / Math.max(data.length, 1),
        refuse: refuse / Math.max(data.length, 1),
        error: error / Math.max(total, 1)
    }
}

Visualizer.prototype.UpdatePredictions = function() {
    for (let name of ["train", "test", "background"])
        if (name in this.dataset.splits)
            this.modelManager.Predict(name, this.dataset.splits[name].data)

    this.PlotMetrics()
    this.PlotHistograms()
}

Visualizer.prototype.UpdateMetrics = function() {
    for (let name of ["train", "test", "background"])
        if (name in this.dataset.splits)
            this.HandleChangeMetrics(name)

    this.PlotMetrics()
    this.PlotHistograms()
}

Visualizer.prototype.PlotHistograms = function() {
    this.histogramsPlot.Reset()

    for (let name of ["train", "background"])
        if (name in this.dataset.splits)
            this.histogramsPlot.Update(this.dataset.splits[name].data.outputs, this.modelManager.predictions[name])

    this.histogramsPlot.Plot()
}

Visualizer.prototype.PlotMetrics = function() {
    this.metricsPlot.Plot()
}
