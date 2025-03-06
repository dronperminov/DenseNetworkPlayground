class Visualizer {
    constructor() {
        this.dataset = new Dataset()
        this.compact = new Compact()
        this.thresholds = new Thresholds(-0.1, 0.1)

        this.InitModel()
        this.InitTrain()
        this.InitViews()
        this.InitEventHandlers()
    }

    InitModel() {
        let model = new NeuralNetwork(2)
        model.AddLayer({size: 10, activation: "abs"})
        model.AddLayer({size: 10, activation: "abs"})
        model.AddLayer({size: 1, activation: ""})

        this.modelManager = new ModelManager(model)
    }

    InitTrain() {
        this.epoch = 0
        this.metrics = new Metrics()
        this.metrics.Add("loss", ["train", "test", "background"])
        this.metrics.Add("refuse", ["train", "test"])
        this.metrics.Add("error", ["train", "test"])

        this.criterion = GetLoss("mse")
        this.optimizer = GetOptimizer("adam", {learningRate: 0.0004, regularizationType: "l2", lambda: 0.001})
        this.batchSize = 16
        this.backgroundPart = 1
    }

    InitViews() {
        let viewBox = new ViewBox(document.getElementById("data-view"))

        this.dataPlot = new DataPlot(document.getElementById("data-plot"), viewBox, this.compact)
        this.dataPlot.AddPlot("train", {border: "#ffffff", colors: ["#2191fb", "#89dd73", "#dd7373"], visible: true})
        this.dataPlot.AddPlot("test", {border: "#000000", colors: ["#2191fb", "#89dd73", "#ba274a"], visible: true})
        this.dataPlot.AddPlot("background", {border: "#ffffff", colors: "#89dd73", visible: false})

        this.dataTable = new DataTable(document.getElementById("data-table"))
        this.dataTable.Add("train", {title: "Обучающие данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})
        this.dataTable.Add("test", {title: "Тестовые данные", colors: {"-1": "#2191fb", "1": "#ba274a"}})

        let modelView = document.getElementById("model-view")
        let modelPlot = document.getElementById("model-plot")
        let modelSurface = document.getElementById("model-surface")
        this.modelPlot = new ModelPlot(viewBox, modelView, modelPlot, modelSurface, this.modelManager.model, this.thresholds)

        this.metricsPlot = new MetricsPlot(document.getElementById("metrics-plot"), this.metrics)
        this.metricsPlot.Add("loss", [
            {label: "train", title: "train", color: "#dd7373", background: "#dd737330"},
            {label: "test", title: "test", color: "#7699d4", background: "#7699d430"},
            {label: "background", title: "bkgr", color: "#89dd73", background: "#89dd7330"}
        ], {title: "Ошибка регрессии", percent: false})

        this.metricsPlot.Add("error", [
            {label: "train", title: "train", color: "#dd7373", background: "#dd737330"},
            {label: "test", title: "test", color: "#7699d4", background: "#7699d430"}
        ], {title: "Ошибка классификации", percent: true})

        this.metricsPlot.Add("refuse", [
            {label: "train", title: "train", color: "#dd7373", background: "#dd737330"},
            {label: "test", title: "test", color: "#7699d4", background: "#7699d430"}
        ], {title: "Отказ от распознавания", percent: true})

        this.histogramsPlot = new HistogramsPlot(document.getElementById("histograms-plot"))
        this.histogramsPlot.Add(1, {color: "#dd7373"})
        this.histogramsPlot.Add(-1, {color: "#7699d4"})
        this.histogramsPlot.Add(0, {color: "#89dd73"})
        this.histogramsPlot.SetThresholds(this.thresholds)
    }

    InitEventHandlers() {
        this.compact.on("change", () => this.dataPlot.ChangeCompact())

        this.dataset.on("change", (name, split) => this.HandleChangeData(name, split))
        this.dataset.on("change-dimension", dimension => this.HandleChangeDimension(dimension))
        this.dataset.on("clear", () => this.HandleClearData())

        this.modelManager.on("change", () => this.HandleChangeModel())
        this.modelManager.on("change-architecture", () => this.HandleChangeModelArchitecture())
        this.modelManager.on("change-prediction", name => this.HandleChangePredictions(name))

        this.modelPlot.on("click-neuron", (layer, neuron, e) => this.HandleClickNeuron(layer, neuron, e))
        this.modelPlot.on("view-click", (e, point) => this.HandleCtrlClickView(e, point))

        this.metrics.on("change", (metric, name, epoch, value) => this.metricsPlot.Set(metric, name, epoch, value))
        this.metrics.on("reset", () => this.metricsPlot.Reset())
        this.thresholds.on("change", (low, high) => this.HandleChangeThresholds(low, high))
    }
}
