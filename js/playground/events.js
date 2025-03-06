Playground.prototype.HandleChangeDimension = function(dimension) {
    this.UpdateAxisDimension(this.axisX, dimension)
    this.UpdateAxisDimension(this.axisY, dimension)

    if (dimension > 1)
        this.axisY.value = 1

    this.SetAxes()
}

Playground.prototype.HandleChangeData = function(name, split) {
    if (name == "train") {
        this.UpdateTrainButtons(split.data.length == 0)
        this.trainDatasetValue.innerText = split.data.length
    }

    if (name == "test")
        this.testDatasetValue.innerText = split.data.length

    if (split.data.length > 0) {
        this.dataBlock.classList.remove("hidden")
        this.dataControlBlock.classList.remove("hidden")
    }
}

Playground.prototype.HandleClearData = function() {
    this.dataBlock.classList.add("hidden")
    this.trainDatasetValue.innerText = "0"
    this.testDatasetValue.innerText = "0"
    this.dataControlBlock.classList.add("hidden")

    this.UpdateTrainButtons(true)
}

Playground.prototype.HandleChangeModelArchitecture = function() {
    let model = this.visualizer.modelManager.model

    this.modelInputsCount.SetValue(model.inputs)
    this.modelLayersCount.SetValue(model.layers.length)
    this.modelLayersSize.SetValue(model.layers[0].outputs)
}

Playground.prototype.UpdateAxisDimension = function(axis, dimension) {
    while (axis.children.length > dimension)
        axis.removeChild(axis.lastChild)

    for (let i = axis.children.length; i < dimension; i++)
        MakeElement(axis, {value: i, innerText: `x${NumberToIndex(i + 1)}`}, "option")
}

Playground.prototype.UpdateTrainButtons = function(disabled) {
    if (disabled) {
        this.Stop()

        if (this.tabExperimentsInput.checked)
            this.tabDataInput.checked = true
    }

    for (let element of [this.startBtn, this.stopBtn, this.stepBtn, this.compactOffset, this.normalizeDataBtn, this.tabExperimentsInput])
        if (disabled)
            element.setAttribute("disabled", "")
        else
            element.removeAttribute("disabled")
}

Playground.prototype.HandleChangeThresholds = function(low, high) {
    this.thresholdLow.value = low
    this.thresholdHigh.value = high

    this.thresholdLowValue.innerText = low
    this.thresholdHighValue.innerText = high
}
