class TreeExperiment {
    constructor(parent, visualizer) {
        this.parent = parent
        this.visualizer = visualizer
        this.controls = {}

        this.model = new NeuralNetwork(2)
        this.model.FromJSON(this.visualizer.modelManager.model.ToJSON())
    }

    Run(backgroundCount, axisX, axisY, modelOutputMode, modelOutputSize) {
        let datas = this.InitDatas(backgroundCount)
        let tree = this.InitTree(datas)

        let leafs = tree.GetLeafs()

        this.ShowSteps(datas)
        this.InitControls(datas, axisX, axisY, modelOutputMode, modelOutputSize)

        this.InitDataModelPlot(leafs)
        this.ShowLeafsInfo(leafs)
        this.InitTreeCellsTable(datas, leafs)
        this.InitDataTable()

        for (let [name, data] of Object.entries(datas)) {
            let split = {data: data, stats: data.GetStatistic()}

            this.dataPlot.ChangeData(name, split)
            this.dataTable.ChangeData(name, split)
        }

        this.SetAxes()
    }

    InitDatas(backgroundCount) {
        let datas = {
            background: this.visualizer.compact.GetData(backgroundCount)
        }

        for (let name of ["train", "test"])
            if (this.visualizer.dataset.splits[name] && this.visualizer.dataset.splits[name].data.length > 0)
                datas[name] = this.visualizer.dataset.splits[name].data

        return datas
    }

    InitTree(datas) {
        let tree = new ExTree()

        for (let [name, data] of Object.entries(datas)) {
            let prediction = this.model.PredictWithSignsUnrolled(data.inputs, data.length)
            tree.Fill(name, data, prediction.result, prediction.signs)
        }

        return tree
    }

    ShowSteps(datas) {
        MakeElement(this.parent, {innerText: "Построение объясняющего дерева (eXTree)"}, "h2")
        let stepsList = MakeElement(this.parent, null, "ul")

        if (datas.train)
            MakeElement(stepsList, {class: "text", innerText: `${datas.train.length} точек обучающей выборки добавлены в дерево`}, "li")

        if (datas.test)
            MakeElement(stepsList, {class: "text", innerText: `${datas.test.length} точек тестовой выборки добавлены в дерево`}, "li")

        MakeElement(stepsList, {class: "text", innerText: `Сгенерированы ${datas.background.length} случайных точек на компакте и добавлены в дерево (с меткой 0)`}, "li")
    }

    InitControls(datas, axisX, axisY, modelOutputMode, modelOutputSize) {
        MakeElement(this.parent, {innerText: "Управление"}, "h3")
        let controls = MakeElement(this.parent, null, "ul")

        let size = MakeElement(controls, {innerHTML: "Количество точек выхода модели: "}, "li")
        this.controls["model-size"] = CloneSelect(modelOutputSize, size)
        this.controls["model-size"].addEventListener("change", () => this.modelPlot.SetSize(this.controls["model-size"].value))

        let mode = MakeElement(controls, {innerHTML: "Режим отображения выхода модели: "}, "li")
        this.controls["model-mode"] = CloneSelect(modelOutputMode, mode)
        this.controls["model-mode"].addEventListener("change", () => this.modelPlot.SetMode(this.controls["model-mode"].value))

        let x = MakeElement(controls, {innerHTML: "Проекционная координата на <b>ось X</b>: "}, "li")
        this.controls["axis-x"] = CloneSelect(axisX, x)
        this.controls["axis-x"].addEventListener("change", () => this.SetAxes())

        let y = MakeElement(controls, {innerHTML: "Проекционная координата на <b>ось Y</b>: "}, "li")
        this.controls["axis-y"] = CloneSelect(axisY, y)
        this.controls["axis-y"].addEventListener("change", () => this.SetAxes())

        if (datas.train) {
            let train = MakeElement(controls, {innerHTML: ""}, "li")
            this.controls["plot-train"] = MakeCheckbox(train, "Отображать обучающие точки", true)
            this.controls["plot-train"].addEventListener("change", () => this.dataPlot.SetVisibility("train", this.controls["plot-train"].checked))
        }

        if (datas.test) {
            let test = MakeElement(controls, {innerHTML: ""}, "li")
            this.controls["plot-test"] = MakeCheckbox(test, "Отображать тестовые точки", false)
            this.controls["plot-test"].addEventListener("change", () => this.dataPlot.SetVisibility("test", this.controls["plot-test"].checked))
        }

        let background = MakeElement(controls, {innerHTML: ""}, "li")
        this.controls["plot-background"] = MakeCheckbox(background, "Отображать фоновые точки", false)
        this.controls["plot-background"].addEventListener("change", () => this.dataPlot.SetVisibility("background", this.controls["plot-background"].checked))
    }

    InitDataModelPlot(leafs) {
        let dataPlotDiv = MakeElement(this.parent, {class: "data-plot", style: "width: 300px; height: 300px;"})
        let modelPlotCanvas = MakeElement(dataPlotDiv, null, "canvas")
        let dataPlotSVG = MakeElement(dataPlotDiv, null, "svg")

        let viewBox = new ViewBox(dataPlotSVG)

        this.dataPlot = new DataPlot(dataPlotDiv, viewBox, this.visualizer.compact)
        this.dataPlot.AddPlot("train", {border: "#ffffff", colors: ["#2191fb", "#89dd73", "#dd7373"], visible: true})
        this.dataPlot.AddPlot("test", {border: "#000000", colors: ["#2191fb", "#89dd73", "#ba274a"], visible: false})
        this.dataPlot.AddPlot("background", {border: "#ffffff", colors: "#89dd73", visible: false})

        this.modelPlot = new ModelCellsPlot(viewBox, modelPlotCanvas, this.model, this.visualizer.thresholds, leafs, this.controls["model-mode"].value, this.controls["model-size"].value)
    }

    ShowLeafsInfo(leafs) {
        MakeElement(this.parent, {innerText: "Ячейки дерева"}, "h3")
        let info = MakeElement(this.parent, null, "ul")
        MakeElement(info, {class: "text", innerText: `Заполненное дерево содержит ${leafs.length} ячеек (листьев)`}, "li")

        let trainOneLeafs = leafs.filter(leaf => leaf.splits.train.total == 1 && leaf.splits.background.total == 0).length
        if (trainOneLeafs > 0)
            MakeElement(info, {class: "text", innerText: `Среди них ${trainOneLeafs} одноэлементных ячеек из обучающих данных (${Round(trainOneLeafs * 100 / leafs.length, 100)}%)`}, "li")

        let testOneLeafs = leafs.filter(leaf => leaf.splits.test.total == 1 && leaf.splits.background.total == 0).length
        if (testOneLeafs > 0)
            MakeElement(info, {class: "text", innerText: `Среди них ${testOneLeafs} одноэлементных ячеек из тестовых данных (${Round(testOneLeafs * 100 / leafs.length, 100)}%)`}, "li")

        MakeElement(info, {class: "text", innerHTML: "<b>c<sub>n</sub>(x)</b> — нейросетевая оценка плотности (среднее значение ± стд. отклонение выхода модели на точках, находящихся внутри ячейки)"}, "li")
        MakeElement(info, {class: "text", innerHTML: "<b>h<sub>n</sub>(x)</b> — гистограммная оценка плотности ячейки"}, "li")
        MakeElement(info, {class: "text", innerHTML: "<b>|c<sub>n</sub>(x) - h<sub>n</sub>(x)|</b> — модуль разности среднего значения нейросетевой оценки и гистограммной оценки"}, "li")
    }

    InitTreeCellsTable(datas, leafs) {
        MakeElement(this.parent, {class: "text", innerText: "Нажмите на строку таблицы, чтобы отобразить выбранную ячейку"}, "p")
        let treeTableDiv = MakeElement(this.parent, {class: "extree-table"})

        this.treeTable = new ExTreeTable(treeTableDiv, datas, this.dataPlot, this.modelPlot, leafs)
        this.treeTable.Plot()
    }

    InitDataTable() {
        MakeElement(this.parent, {innerText: "Данные, которыми заполнено дерево"}, "h3")
        let dataTableDiv = MakeElement(this.parent, {class: "data-table"})

        this.dataTable = new DataTable(dataTableDiv)
        this.dataTable.Add("train", {title: "Обучающие данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})
        this.dataTable.Add("test", {title: "Тестовые данные", colors: {"-1": "#2191fb", "1": "#ba274a"}})
        this.dataTable.Add("background", {title: "Фон", colors: {"0": "#89dd73"}})
    }

    SetAxes() {
        let axisX = +this.controls["axis-x"].value
        let axisY = +this.controls["axis-y"].value

        this.dataPlot.SetAxes(axisX, axisY)
        this.modelPlot.SetAxes(axisX, axisY)
    }
}
