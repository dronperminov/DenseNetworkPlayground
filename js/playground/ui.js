Playground.prototype.SetModelInputsCount = function(inputs) {
    if (this.visualizer.HaveData(["train", "test"]) && !confirm("Вы уверены, что хотите изменить размерность входа модели?")) {
        this.modelInputsCount.SetValue(this.visualizer.GetDimension())
        return
    }

    this.RemoveTrainerModel()
    this.visualizer.SetDimension(inputs)
}

Playground.prototype.SetModelLayersCount = function(count, size, activation) {
    this.visualizer.SetModelLayersCount(count, size, activation)
}

Playground.prototype.SetModelLayersSize = function(size) {
    this.visualizer.SetModelLayersSize(size)
}

Playground.prototype.SetModelActivation = function(activation) {
    this.visualizer.SetActivation(activation)
}

Playground.prototype.DownloadModel = function() {
    this.visualizer.DownloadModel()
}

Playground.prototype.UploadModel = function() {
    if (this.modelFileInput.files.length != 1)
        return

    let reader = new FileReader()
    reader.addEventListener("load", e => {
        this.LoadModel(JSON.parse(e.target.result))
        this.modelFileInput.value = ""
    })

    reader.readAsText(this.modelFileInput.files[0])
}

Playground.prototype.LoadModel = function(data) {
    let message = `Входная размерность загружаемой модели (${data.inputs}) отличается от размера текущей, имеющиеся данные будут очищены. Желаете продолжить?`

    if (data.inputs != this.visualizer.GetDimension() && !confirm(message))
        return

    try {
        this.visualizer.LoadModel(data)
    }
    catch (error) {
        alert(error.message)
        return
    }
}

Playground.prototype.SetTrainerModel = function() {
    this.visualizer.SetTrainerModel()
    this.trainerModelBlock.classList.remove("hidden")
    this.setTrainerModelBtn.classList.add("hidden")
    this.removeTrainerModelBtn.classList.remove("hidden")

    let architecture = new ModelArchitectureLayer(this.trainerModelSVG, this.visualizer.modelManager.trainerModel, false)
}

Playground.prototype.RemoveTrainerModel = function() {
    this.visualizer.RemoveTrainerModel()
    this.removeTrainerModelBtn.classList.add("hidden")
    this.setTrainerModelBtn.classList.remove("hidden")
    this.trainerModelBlock.classList.add("hidden")
}

Playground.prototype.RemoveDisabledNeurons = function() {
    this.visualizer.RemoveDisabledNeurons()
}

Playground.prototype.SetLearningRate = function(learningRate) {
    this.visualizer.SetLearningRate(learningRate)
    this.UpdateLearningRateIcon()
}

Playground.prototype.SetBatchSize = function(batchSize) {
    this.visualizer.SetBatchSize(batchSize)
    this.UpdateBatchSizeIcon()
}

Playground.prototype.SetBackgroundPart = function(backgroundPart) {
    this.visualizer.SetBackgroundPart(backgroundPart)
    this.UpdateBackgroundPartIcon()
}

Playground.prototype.SetCriterion = function(criterion) {
    this.visualizer.SetCriterion(criterion)
    this.UpdateCriterionIcon()
}

Playground.prototype.SetOptimizer = function(optimizer) {
    this.visualizer.SetOptimizer(optimizer)
    this.UpdateOptimizerIcon()
}

Playground.prototype.SetRegularizationType = function(regularizationType) {
    this.visualizer.SetRegularizationType(regularizationType)
    this.UpdateRegularizationIcon()
}

Playground.prototype.SetRegularization = function(lambda) {
    this.visualizer.SetRegularization(lambda)
    this.UpdateRegularizationIcon()
}

Playground.prototype.SetModelOutputMode = function(mode) {
    this.visualizer.SetModelOutputMode(mode)

    if (mode == "no")
        this.modelOutputBlock.classList.add("hidden")
    else
        this.modelOutputBlock.classList.remove("hidden")
}

Playground.prototype.SetModelOutputSize = function(size) {
    this.visualizer.SetModelOutputSize(size)
}

Playground.prototype.SetModelWeightsMode = function(mode) {
    this.visualizer.SetModelWeightsMode(mode)
}

Playground.prototype.SetCellsLayer = function(layer) {
    this.visualizer.SetCellsLayer(layer)
}

Playground.prototype.SetAxes = function() {
    let xAxis = +this.axisX.value
    let yAxis = +this.axisY.value
    this.visualizer.SetAxes(xAxis, yAxis)
}

Playground.prototype.GenerateData = function(replace = true) {
    let count = this.dataCount.GetValue()
    let testCount = Math.floor(count * this.dataTestPart.GetValue() / 100)
    let trainCount = count - testCount

    let config = this.dataGenerator.GetConfig()
    config.balance = this.dataBalance.GetValue() / 100
    config.error = this.dataError.GetValue() / 100
    config.unary = this.dataUnary.checked

    try {
        let trainData = this.dataGenerator.Generate(trainCount, config)
        let testData = this.dataGenerator.Generate(testCount, config)

        if (replace) {
            playground.visualizer.SetData("train", trainData)
            playground.visualizer.SetData("test", testData)
        }
        else {
            playground.visualizer.AddData("train", trainData)
            playground.visualizer.AddData("test", testData)
        }
    }
    catch (error) {
        alert(`Не удалось сгенерировать данные (${error.message})`)
    }
}

Playground.prototype.ChangeUploadDataFile = function() {
    this.uploadDataBlock.classList.remove("hidden")
}

Playground.prototype.ResetUploadData = function() {
    this.trainFileInput.Reset()
    this.testFileInput.Reset()
    this.uploadDataBlock.classList.add("hidden")
}

Playground.prototype.UploadData = function() {
    let files = {
        train: this.trainFileInput.GetFile(),
        test: this.testFileInput.GetFile()
    }

    let promises = []

    for (let [name, file] of Object.entries(files)) {
        if (file === null)
            continue

        promises.push(new Promise(resolve => {
            let reader = new FileReader()
            reader.readAsText(file)
            reader.onload = () => resolve({name: name, text: reader.result})
        }))
    }

    Promise.all(promises).then(results => this.ParseUploadData(results))
}

Playground.prototype.ParseUploadData = function(results) {
    let reader = new CSVReader()
    let splits = {}
    let name2text = {train: "обучающих", test: "тестовых"}
    let targetDimension = this.visualizer.GetDimension()

    try {
        for (let result of results) {
            let {header, rows} = reader.Read(result.text)
            let dimension = header.length - 1

            if (dimension != targetDimension)
                throw new Error(`некорректная размерность ${name2text[result.name]} данных: ${dimension} (ожидалось ${targetDimension})`)

            splits[result.name] = Data.FromCSV(header, rows)
        }

        for (let [name, data] of Object.entries(splits))
            this.visualizer.SetData(name, data)
    }
    catch (error) {
        alert(`Ошибка: ${error.message}`)
    }

    this.ResetUploadData()
}

Playground.prototype.NormalizeData = function() {
    let mode = this.dataNormalizationMode.value
    this.visualizer.NormalizeData(mode)
}

Playground.prototype.ClearData = function() {
    this.visualizer.ClearData()
}

Playground.prototype.DownloadDataset = function() {
    this.visualizer.DownloadDataset()
}

Playground.prototype.SetCompactOffset = function(offset) {
    this.visualizer.SetCompactOffset(offset / 100)
}

Playground.prototype.UpdateLearningRateIcon = function() {
    this.learningRateValue.innerText = this.visualizer.optimizer.learningRate
}

Playground.prototype.UpdateBatchSizeIcon = function() {
    this.batchSizeValue.innerText = this.visualizer.batchSize
}

Playground.prototype.UpdateBackgroundPartIcon = function() {
    this.backgroundPartValue.innerText = this.visualizer.backgroundPart * 100
}

Playground.prototype.UpdateCriterionIcon = function() {
    this.criterionValue.innerText = this.visualizer.criterion.name
}

Playground.prototype.UpdateOptimizerIcon = function() {
    this.optimizerValue.innerText = this.visualizer.optimizer.name
}

Playground.prototype.UpdateRegularizationIcon = function() {
    if (this.visualizer.optimizer.regularizationType == "l1") {
        this.regularizationL1Value.parentNode.classList.remove("hidden")
        this.regularizationL1Value.innerText = this.visualizer.optimizer.lambda
    }
    else
        this.regularizationL1Value.parentNode.classList.add("hidden")

    if (this.visualizer.optimizer.regularizationType == "l2") {
        this.regularizationL2Value.parentNode.classList.remove("hidden")
        this.regularizationL1Value.innerText = this.visualizer.optimizer.lambda
    }
    else
        this.regularizationL2Value.parentNode.classList.add("hidden")

    if (this.visualizer.optimizer.regularizationType == "")
        this.regularization.parentNode.classList.add("hidden")
    else
        this.regularization.parentNode.classList.remove("hidden")
}

Playground.prototype.UpdateTrainIcons = function() {
    this.UpdateLearningRateIcon()
    this.UpdateBatchSizeIcon()
    this.UpdateBackgroundPartIcon()
    this.UpdateCriterionIcon()
    this.UpdateOptimizerIcon()
    this.UpdateRegularizationIcon()
}
