class Visualizer {
    constructor() {
        this.dataset = new Dataset()
        this.compact = new Compact()
        this.thresholds = new Thresholds()

        this.InitModel()
        this.InitTrain()
        this.InitViews()
        this.InitEventHandlers()
    }

    InitModel() {
        this.model = new NeuralNetwork(2)
        this.model.AddLayer({size: 10, activation: "abs"})
        this.model.AddLayer({size: 10, activation: "abs"})
        this.model.AddLayer({size: 1, activation: ""})

        this.modelManager = new ModelManager(this.model)
    }

    InitTrain() {
        this.SetCriterion("mse")
        this.SetOptimizer("adam", {learningRate: 0.004, regularizationType: "", lambda: 0.001})
        this.SetBatchSize(16)
        this.SetBackgroundPart(1)
    }

    InitViews() {
        let viewBox = new ViewBox(document.getElementById("data-view"))

        this.dataPlot = new DataPlot(document.getElementById("data-plot"), viewBox, this.compact)
        this.dataPlot.AddPlot("train", {border: "#ffffff", colors: ["#2191fb", "#89dd73", "#dd7373"], visible: true})
        this.dataPlot.AddPlot("test", {border: "#000000", colors: ["#2191fb", "#89dd73", "#ba274a"], visible: true})
        this.dataPlot.AddPlot("background", {border: "#ffffff", colors: "#89dd73", visible: true})

        this.dataTable = new DataTable(document.getElementById("data-table"))
        this.dataTable.Add("train", {title: "Обучающие данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})
        this.dataTable.Add("test", {title: "Тестовые данные", colors: {"-1": "#2191fb", "1": "#ba274a"}})

        this.modelPlot = new ModelPlot(viewBox, document.getElementById("model-view"), document.getElementById("model-plot"), this.model, this.thresholds)
    }

    InitEventHandlers() {
        this.dataset.on("change", (name, split) => this.HandleChangeData(name, split))
        this.dataset.on("change-dimension", dimension => this.HandleChangeDimension(dimension))
        this.dataset.on("clear", () => this.HandleClearData())

        this.modelManager.on("change", () => this.HandleChangeModel())
        this.modelManager.on("change-architecture", () => this.HandleChangeModelArchitecture())

        this.modelPlot.on("click-neuron", (layer, neuron, e) => this.HandleClickNeuron(layer, neuron, e))

        this.thresholds.on("change", (low, high) => this.HandleChangeThresholds(low, high))
    }
}
