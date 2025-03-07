Playground.prototype.BuildAxisSelect = function(dimension, axis, parent = null) {
    let select = MakeElement(parent, {class: "basic-input inline-input"}, "select")

    for (let i = 0; i < dimension; i++)
        MakeElement(select, {value: i, innerText: `x${NumberToIndex(i + 1)}`}, "option")

    select.value = axis
    return select
}

Playground.prototype.RunSyntheticDataExperiment = function() {
    let count = this.syntheticDataBackgroundCount.GetValue()
    let data = this.visualizer.GenerateSyntheticData(count)
    let split = {data: data, stats: data.GetStatistic()}
    let thresholds = this.visualizer.thresholds

    this.tabExperiments.innerHTML = ""
    MakeElement(this.tabExperiments, {innerText: "Генерация синтетических данных"}, "h2")
    let stepsList = MakeElement(this.tabExperiments, null, "ul")
    MakeElement(stepsList, {class: "text", innerText: `Сгенерированы ${count} случайных точек на компакте`}, "li")
    MakeElement(stepsList, {class: "text", innerHTML: "Для каждой сгенерированной точки x<sub>i</sub> была получено предсказание модели y<sub>i</sub>"}, "li")

    if (thresholds.low < thresholds.high)
        MakeElement(stepsList, {class: "text", innerHTML: `Точки с ${thresholds.low} &le; y<sub>i</sub> &lt; ${thresholds.high} были удалены (пороги доверия)`}, "li")

    MakeElement(stepsList, {class: "text", innerHTML: "В качестве синтетической выборки были выбраны точки x<sub>i</sub> с вероятностью |y<sub>i</sub>|"}, "li")

    if (data.length == 0) {
        MakeElement(stepsList, {class: "text", innerText: "В результате все сгенерированные точки были отвергнуты"}, "li")
        return
    }

    MakeElement(stepsList, {class: "text", innerHTML: `В результате были отобраны <b>${data.length}</b> точек (${Round(data.length * 100 / count, 10)}%)`}, "li")

    let axisList = MakeElement(this.tabExperiments, null, "ul")
    let liX = MakeElement(axisList, {innerHTML: "Проекционная координата на <b>ось X</b>: "}, "li")
    let liY = MakeElement(axisList, {innerHTML: "Проекционная координата на <b>ось Y</b>: "}, "li")

    let axisX = this.BuildAxisSelect(data.dimension, this.axisX.value, liX)
    let axisY = this.BuildAxisSelect(data.dimension, this.axisY.value, liY)

    let dataPlotDiv = MakeElement(this.tabExperiments, {class: "data-plot", style: "width: 300px; height: 300px;"})
    let dataPlotSVG = MakeElement(dataPlotDiv, null, "svg")
    let dataTableDiv = MakeElement(this.tabExperiments, {class: "data-table"})

    let viewBox = new ViewBox(dataPlotSVG)

    let dataPlot = new DataPlot(dataPlotDiv, viewBox, this.visualizer.compact)
    dataPlot.AddPlot("synthetic", {border: "#ffffff", colors: ["#2191fb", "#89dd73", "#dd7373"], visible: true})
    dataPlot.SetAxes(+axisX.value, +axisY.value)

    axisX.addEventListener("change", () => dataPlot.SetAxes(+axisX.value, +axisY.value))
    axisY.addEventListener("change", () => dataPlot.SetAxes(+axisX.value, +axisY.value))

    let dataTable = new DataTable(dataTableDiv)
    dataTable.Add("synthetic", {title: "Синтетические данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})

    dataTable.ChangeData("synthetic", split)
    dataPlot.ChangeData("synthetic", split)
    dataPlot.ResetLimits()
}

Playground.prototype.RunTreeExperiment = function() {
    let count = this.treeBackgroundCount.GetValue()

    let datas = {
        train: this.visualizer.dataset.splits.train.data,
        test: this.visualizer.dataset.splits.test.data,
        background: this.visualizer.compact.GetData(count)
    }

    let tree = new ExTree()

    for (let [name, data] of Object.entries(datas)) {
        let prediction = this.visualizer.modelManager.model.PredictWithSignsUnrolled(data.inputs, data.length)
        tree.Fill(name, data, prediction.result, prediction.signs)
    }

    let leafs = tree.GetLeafs()
    let trainOneLeafs = leafs.filter(leaf => leaf.splits.train.total == 1 && leaf.splits.background.total == 0)
    let testOneLeafs = leafs.filter(leaf => leaf.splits.test.total == 1 && leaf.splits.background.total == 0)

    this.tabExperiments.innerHTML = ""
    MakeElement(this.tabExperiments, {innerText: "Построение объясняющего дерева (eXTree)"}, "h2")
    let stepsList = MakeElement(this.tabExperiments, null, "ul")

    MakeElement(stepsList, {class: "text", innerText: `${datas.train.length} точек обучающей выборки добавлены в дерево`}, "li")
    MakeElement(stepsList, {class: "text", innerText: `${datas.test.length} точек тестовой выборки добавлены в дерево`}, "li")
    MakeElement(stepsList, {class: "text", innerText: `Сгенерированы ${count} случайных точек на компакте и добавлены в дерево (с меткой 0)`}, "li")

    MakeElement(this.tabExperiments, {innerText: "Управление"}, "h3")
    let controlsList = MakeElement(this.tabExperiments, null, "ul")

    let liX = MakeElement(controlsList, {innerHTML: "Проекционная координата на <b>ось X</b>: "}, "li")
    let liY = MakeElement(controlsList, {innerHTML: "Проекционная координата на <b>ось Y</b>: "}, "li")

    let liTrain = MakeElement(controlsList, {innerHTML: ""}, "li")
    let liTest = MakeElement(controlsList, {innerHTML: ""}, "li")
    let liBackground = MakeElement(controlsList, {innerHTML: ""}, "li")

    let axisX = this.BuildAxisSelect(datas.train.dimension, this.axisX.value, liX)
    let axisY = this.BuildAxisSelect(datas.train.dimension, this.axisY.value, liY)

    let trainCheckbox = MakeCheckbox(liTrain, "Отображать обучающие точки", true)
    let testCheckbox = MakeCheckbox(liTest, "Отображать тестовые точки", false)
    let backgroundCheckbox = MakeCheckbox(liBackground, "Отображать фоновые точки", false)

    let dataPlotDiv = MakeElement(this.tabExperiments, {class: "data-plot", style: "width: 300px; height: 300px;"})
    let dataPlotSVG = MakeElement(dataPlotDiv, null, "svg")

    MakeElement(this.tabExperiments, {innerText: "Ячейки дерева"}, "h3")
    let leafsInfoList = MakeElement(this.tabExperiments, null, "ul")
    MakeElement(leafsInfoList, {class: "text", innerText: `Заполненное дерево содержит ${leafs.length} ячеек (листьев)`}, "li")

    if (trainOneLeafs.length > 0)
        MakeElement(leafsInfoList, {class: "text", innerText: `Среди них ${trainOneLeafs.length} одноэлементных ячеек из обучающих данных (${Round(trainOneLeafs.length * 100 / leafs.length, 100)}%)`}, "li")

    if (testOneLeafs.length > 0)
        MakeElement(leafsInfoList, {class: "text", innerText: `Среди них ${testOneLeafs.length} одноэлементных ячеек из тестовых данных (${Round(testOneLeafs.length * 100 / leafs.length, 100)}%)`}, "li")

    MakeElement(leafsInfoList, {class: "text", innerHTML: "<b>c<sub>n</sub>(x)</b> — нейросетевая оценка плотности (среднее значение ± стд. отклонение выхода модели на точках, находящихся внутри ячейки)"}, "li")
    MakeElement(leafsInfoList, {class: "text", innerHTML: "<b>h<sub>n</sub>(x)</b> — гистограммная оценка плотности ячейки"}, "li")
    MakeElement(leafsInfoList, {class: "text", innerHTML: "<b>|c<sub>n</sub>(x) - h<sub>n</sub>(x)|</b> — модуль разности среднего значения нейросетевой оценки и гистограммной оценки"}, "li")

    MakeElement(this.tabExperiments, {class: "text", innerText: "Нажмите на строку таблицы, чтобы отобразить выбранную ячейку"}, "p")
    let treeTableDiv = MakeElement(this.tabExperiments, {class: "extree-table"})

    MakeElement(this.tabExperiments, {innerText: "Данные, которыми заполнено дерево"}, "h3")
    let dataTableDiv = MakeElement(this.tabExperiments, {class: "data-table"})

    let viewBox = new ViewBox(dataPlotSVG)

    let dataPlot = new DataPlot(dataPlotDiv, viewBox, this.visualizer.compact)
    dataPlot.AddPlot("train", {border: "#ffffff", colors: ["#2191fb", "#89dd73", "#dd7373"], visible: true})
    dataPlot.AddPlot("test", {border: "#000000", colors: ["#2191fb", "#89dd73", "#ba274a"], visible: false})
    dataPlot.AddPlot("background", {border: "#ffffff", colors: "#89dd73", visible: false})
    dataPlot.SetAxes(+axisX.value, +axisY.value)

    axisX.addEventListener("change", () => dataPlot.SetAxes(+axisX.value, +axisY.value))
    axisY.addEventListener("change", () => dataPlot.SetAxes(+axisX.value, +axisY.value))
    trainCheckbox.addEventListener("change", () => dataPlot.SetVisibility("train", trainCheckbox.checked))
    testCheckbox.addEventListener("change", () => dataPlot.SetVisibility("test", testCheckbox.checked))
    backgroundCheckbox.addEventListener("change", () => dataPlot.SetVisibility("background", backgroundCheckbox.checked))

    let treeTable = new ExTreeTable(treeTableDiv, datas, dataPlot, leafs)
    treeTable.Plot()

    let dataTable = new DataTable(dataTableDiv)
    dataTable.Add("train", {title: "Обучающие данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})
    dataTable.Add("test", {title: "Тестовые данные", colors: {"-1": "#2191fb", "1": "#ba274a"}})
    dataTable.Add("background", {title: "Фон", colors: {"0": "#89dd73"}})

    for (let [name, data] of Object.entries(datas)) {
        let split = {data: data, stats: data.GetStatistic()}

        dataPlot.ChangeData(name, split)
        dataTable.ChangeData(name, split)
    }

    dataPlot.ResetLimits()
}
