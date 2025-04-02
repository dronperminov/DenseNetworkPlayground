class MissedDataExperiment {
    constructor(parent, visualizer) {
        this.parent = parent
        this.visualizer = visualizer
        this.controls = {}
    }

    Run(rowsPart, columnsPart) {
        let trainData = this.visualizer.dataset.splits.train.data
        let testData = this.visualizer.dataset.splits.test.data
        let dimension = trainData.dimension
        let nanColumns = Math.max(1, Math.min(dimension - 1, dimension * columnsPart))

        let [completeData, missedData] = trainData.Split(1 - rowsPart, true)
        missedData.FillNans(nanColumns)

        this.ShowSteps(completeData, missedData)
        this.InitDataTable(trainData, testData, completeData, missedData)

        let configs = []

        for (let label of ["all", ...trainData.GetUniqueLabels()]) {
            let model = this.visualizer.modelManager.model.Clone({reset: true})

            configs.push({
                label: label,
                data: {
                    complete: label === "all" ? completeData.Copy() : completeData.GetByLabel(label, 1),
                    missed: label === "all" ? missedData.Copy() : missedData.GetByLabel(label, 1),
                    test: label === "all" ? testData.Copy() : testData.GetByLabel(label, 1),
                },
                modelManager: new ModelManager(model)
            })
        }

        for (let config of configs)
            this.InitTrainBlock(config)
    }

    ShowSteps(completeData, missedData) {
        MakeElement(this.parent, {innerText: "Обработка данных с пропусками"}, "h2")
        let stepsList = MakeElement(this.parent, null, "ul")

        MakeElement(stepsList, {class: "text", innerHTML: "Обучающие данные разделены на два поднабора: комплектные и некомплектные"}, "li")
        MakeElement(stepsList, {class: "text", innerHTML: "В некомплектный набор вставлены пропуски случаным образом"}, "li")
    }

    InitDataTable(trainData, testData, completeData, missedData) {
        let dataTableDiv = MakeElement(this.parent, {class: "data-table"})

        this.dataTable = new DataTable(dataTableDiv)
        this.dataTable.Add("train", {title: "Обучающие данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})
        this.dataTable.Add("complete", {title: "Коплектные данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})
        this.dataTable.Add("missed", {title: "Некоплектные данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})
        this.dataTable.Add("test", {title: "Тестовые данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})

        this.dataTable.ChangeData("train", {data: trainData, stats: trainData.GetStatistic()})
        this.dataTable.ChangeData("complete", {data: completeData, stats: completeData.GetStatistic()})
        this.dataTable.ChangeData("missed", {data: missedData, stats: missedData.GetStatistic()})
        this.dataTable.ChangeData("test", {data: testData, stats: testData.GetStatistic()})
    }

    InitTrainBlock(config) {
        let block = MakeElement(this.parent, {class: "train-block"})

        let dataPlotDiv = MakeElement(block, {class: "data-plot"})
        let modelPlotCanvas = MakeElement(dataPlotDiv, null, "canvas")
        let dataPlotSVG = MakeElement(dataPlotDiv, null, "svg")
        let viewBox = new ViewBox(dataPlotSVG)

        config.dataPlot = new DataPlot(dataPlotDiv, viewBox, this.visualizer.compact)
        config.dataPlot.AddPlot("complete", {border: "#ffffff", colors: ["#2191fb", "#89dd73", "#dd7373"], visible: true})
        config.dataPlot.AddPlot("synthetic", {border: "#000000", colors: ["#2191fb", "#89dd73", "#dd7373"], visible: true})
        config.dataPlot.ChangeData("complete", {data: config.data.complete, stats: null})
        config.dataPlot.SetAxes(0, 1)

        config.modelPlot = new ModelCellsPlot(viewBox, modelPlotCanvas, config.modelManager.model, this.visualizer.thresholds, "", 100)//this.controls["model-mode"].value, this.controls["model-size"].value)
        config.modelManager.on("change", () => this.HandleChangeModel(config))
        config.modelManager.on("change-prediction", name => this.HandleChangePredictions(config, name))

        let controlsBlock = MakeElement(block, {class: "controls-block"})
        MakeElement(controlsBlock, {innerText: config.label == "all" ? "Обучение модели на двух классах" : `Обучение модели для класса "${config.label}" (унарная классификация)`}, "h3")

        let buttonsBlock = MakeElement(controlsBlock, {class: "train-buttons"})
        config.resetButton = MakeElement(buttonsBlock, {class: "basic-button", innerText: "Сброс"}, "button")
        config.startButton = MakeElement(buttonsBlock, {class: "basic-button", innerText: "Старт"}, "button")
        config.stopButton = MakeElement(buttonsBlock, {class: "basic-button hidden", innerText: "Стоп"}, "button")
        config.stepButton = MakeElement(buttonsBlock, {class: "basic-button", innerText: "Шаг"}, "button")
        config.fillMissed = MakeCheckbox(buttonsBlock, "заполнять пропуски", false)

        config.resetButton.addEventListener("click", () => this.ResetTrain(config))
        config.startButton.addEventListener("click", () => this.StartTrain(config))
        config.stopButton.addEventListener("click", () => this.StopTrain(config))
        config.stepButton.addEventListener("click", () => {
            this.StopTrain(config)
            this.StepTrain(config)
        })

        config.running = false
        config.epoch = 0
        config.optimizer = GetOptimizer(this.visualizer.optimizer.name, this.visualizer.optimizer.GetConfig())

        config.metrics = new Metrics()
        config.metrics.Add("loss", ["complete", "synthetic", "test"])
        config.metrics.Add("refuse", ["complete", "synthetic", "test"])
        config.metrics.Add("error", ["complete", "synthetic", "test"])

        let metricsDiv = MakeElement(controlsBlock, {class: "metrics-plot"})

        config.metricsPlot = new MetricsPlot(metricsDiv, config.metrics)
        config.metricsPlot.Add("loss", [
            {label: "complete", title: "complete", color: "#dd7373", background: "#dd737330"},
            {label: "synthetic", title: "synthetic", color: "#89dd73", background: "#89dd7330"},
            {label: "test", title: "test", color: "#7699d4", background: "#7699d430"},
        ], {title: "Ошибка регрессии", percent: false})

        config.metricsPlot.Add("error", [
            {label: "complete", title: "complete", color: "#dd7373", background: "#dd737330"},
            {label: "synthetic", title: "synthetic", color: "#89dd73", background: "#89dd7330"},
            {label: "test", title: "test", color: "#7699d4", background: "#7699d430"}
        ], {title: "Ошибка классификации", percent: true})

        config.metricsPlot.Add("refuse", [
            {label: "complete", title: "complete", color: "#dd7373", background: "#dd737330"},
            {label: "synthetic", title: "synthetic", color: "#89dd73", background: "#89dd7330"},
            {label: "test", title: "test", color: "#7699d4", background: "#7699d430"}
        ], {title: "Отказ от распознавания", percent: true})

        config.metrics.on("change", (metric, name, epoch, value) => config.metricsPlot.Set(metric, name, epoch, value))
        config.metrics.on("reset", () => config.metricsPlot.Reset())

        this.visualizer.thresholds.on("change", (low, high) => this.HandleChangeThresholds(config))

        this.RunTrain(config)
        this.HandleChangeModel(config)
    }

    HandleChangeModel(config) {
        config.modelPlot.Plot()

        for (let name of ["complete", "synthetic", "test"])
            if (config.data[name])
                config.modelManager.Predict(name, config.data[name])

        config.metricsPlot.Plot()
    }

    HandleChangePredictions(config, name) {
        let data = config.data[name]

        if (data.length == 0)
            return

        let predictions = config.modelManager.predictions[name]
        let metrics = this.visualizer.EvaluateMetricsOnData(data, predictions)

        config.metrics.Set("loss", name, config.epoch, metrics.loss)
        config.metrics.Set("error", name, config.epoch, metrics.error)
        config.metrics.Set("refuse", name, config.epoch, metrics.refuse)
    }

    HandleChangeThresholds(config) {
        for (let name of ["complete", "synthetic", "test"])
            if (config.data[name])
                this.HandleChangePredictions(config, name)

        config.modelPlot.Plot()
        config.metricsPlot.Plot()
    }

    StartTrain(config) {
        config.startButton.classList.add("hidden")
        config.stopButton.classList.remove("hidden")
        config.running = true
    }

    StopTrain(config) {
        config.startButton.classList.remove("hidden")
        config.stopButton.classList.add("hidden")
        config.running = false
    }

    StepTrain(config) {
        let data = this.GetTrainData(config)

        config.optimizer.SetLearningRate(this.visualizer.optimizer.learningRate)
        config.optimizer.SetRegularization(this.visualizer.optimizer.lambda)
        config.optimizer.SetRegularizationType(this.visualizer.optimizer.regularizationType)

        config.epoch++
        config.modelManager.Train(data, this.visualizer.batchSize, config.optimizer, this.visualizer.criterion)
    }

    ResetTrain(config) {
        this.StopTrain(config)

        config.epoch = 0
        config.optimizer.Reset()
        config.metrics.Reset()
        config.modelManager.Reset(false)
        config.dataPlot.ChangeData("synthetic", Data.Empty(config.data.complete.dimension))
    }

    RunTrain(config) {
        if (config.running)
            this.StepTrain(config)

        window.requestAnimationFrame(() => this.RunTrain(config))
    }

    GetTrainData(config) {
        let dimension = config.data.complete.dimension
        let datas = [config.data.complete]

        let syntheticData = this.FillMissedData(config)
        if (syntheticData) {
            datas.push(syntheticData)
            config.dataPlot.ChangeData("synthetic", {data: syntheticData, stats: null})
        }
        else {
            config.dataPlot.ChangeData("synthetic", {data: Data.Empty(dimension), stats: null})
        }

        datas.push(this.visualizer.compact.GetData(datas.reduce((sum, data) => sum + data.length, 0)))

        let length = datas.reduce((sum, data) => sum + data.length, 0)
        let inputs = new Float64Array(length * dimension)
        let outputs = new Float64Array(length)

        let indices = []

        for (let index = 0; index < datas.length; index++)
            for (let i = 0; i < datas[index].length; i++)
                indices.push([index, i])

        Random.Shuffle(indices)

        for (let i = 0; i < length; i++) {
            let data = datas[indices[i][0]]
            let index = indices[i][1]

            for (let j = 0; j < dimension; j++)
                inputs[i * dimension + j] = data.inputs[index * dimension + j]

            outputs[i] = data.outputs[index]
        }

        return new Data(inputs, outputs, dimension)
    }

    FillMissedData(config, maxLoops = 100) {
        if (!config.fillMissed.checked)
            return null

        let data = config.data.missed.Copy()
        let limits = []

        for (let i = 0; i < data.dimension; i++)
            limits[i] = this.visualizer.compact.GetLimits(i)

        let input = new Float64Array(data.dimension)
        let output = new Float64Array(1)
        let length = 0

        for (let i = 0; i < data.length; i++) {
            let indices = []

            for (let j = 0; j < data.dimension; j++) {
                input[j] = data.inputs[i * data.dimension + j]

                if (isNaN(data.inputs[i * data.dimension + j]))
                    indices.push(j)
            }

            let filled = false
            for (let loop = 0; loop < maxLoops && !filled; loop++) {
                for (let index of indices)
                    input[index] = Random.Uniform(this.visualizer.compact.min[index], this.visualizer.compact.max[index])

                config.modelManager.model.Predict(input, 1, output)
                filled = this.visualizer.thresholds.GetLabel(output[0]) != 0 && Math.random() < data.outputs[i] * output[0]
            }

            if (!filled)
                continue

            for (let j = 0; j < data.dimension; j++)
                data.inputs[length * data.dimension + j] = input[j]

            data.outputs[length++] = data.outputs[i]
        }

        data.length = length
        return data
    }
}
