class DataGeneratorUI {
    constructor(div) {
        this.div = div
        this.generators = []
        this.generator = null
    }

    Add(generator) {
        let block = MakeElement(this.div, {class: "hidden"})

        let datasetBlock = MakeElement(block, {class: "menu-block"})
        let select = MakeSelect(datasetBlock, "Датасет", generator.config, generator.config[0].name)
        select.addEventListener("change", () => this.ChangeDataset())

        let params = MakeElement(block)
        let dataset2params = {}

        for (let config of generator.config)
            dataset2params[config.name] = this.BuildParams(config.params, params)

        this.generators.push({
            dimension: generator.dimension,
            generator: generator,
            block: block,
            select: select,
            dataset2params: dataset2params
        })
    }

    ChangeDimension(dimension) {
        this.generator = null

        for (let generator of this.generators) {
            if (generator.dimension != dimension) {
                generator.block.classList.add("hidden")
                continue
            }

            generator.block.classList.remove("hidden")
            this.generator = generator
        }

        if (this.generator == null) {
            this.div.parentNode.classList.add("hidden")
        }
        else {
            this.div.parentNode.classList.remove("hidden")
            this.ChangeDataset()
        }
    }

    BuildParams(params, parent) {
        let block = MakeElement(parent, {class: "menu-block menu-multiple-block hidden"})
        let name2input = {}

        MakeElement(block, {innerText: "Параметры"}, "label")

        for (let row of params) {
            let rowBlock = MakeElement(block, {class: "menu-block-grid"})

            for (let param of row)
                name2input[param.name] = this.BuildParam(param, rowBlock)
        }

        return {
            block: block,
            name2input: name2input
        }
    }

    BuildParam(param, parent) {
        if (param.type == "vector") {
            let label = MakeElement(parent, {innerHTML: param.title}, "label")
            let input = new VectorInput(param.dimension, label)

            if ("value" in param)
                input.SetValue(param.value)

            return input
        }

        if (param.type == "matrix") {
            let label = MakeElement(parent, {innerHTML: param.title}, "label")
            let input = new MatrixInput(param.dimension, param.properties, label)

            if ("value" in param)
                input.SetValue(param.value)

            return input
        }

        let attributes = {type: "number"}

        if ("value" in param)
            attributes.value = param.value

        if ("step" in param)
            attributes.step = param.step

        if ("min" in param)
            attributes.min = param.min

        if ("max" in param)
            attributes.max = param.max

        let input = MakeInput(parent, param.title, attributes)
        return new NumberInput(input)
    }

    ChangeDataset() {
        for (let params of Object.values(this.generator.dataset2params))
            params.block.classList.add("hidden")

        let dataset = this.generator.select.value
        let dataset2params = this.generator.dataset2params[dataset]
        dataset2params.block.classList.remove("hidden")
    }

    GetParams(dataset) {
        let dataset2params = this.generator.dataset2params[dataset]
        let params = {}

        for (let [key, input] of Object.entries(dataset2params.name2input))
            params[key] = input.GetValue()

        return params
    }

    GetConfig() {
        let dataset = this.generator.select.value
        let params = this.GetParams(dataset)

        return {dataset: dataset, params: params}
    }

    Generate(count, config) {
        return this.generator.generator.Generate(count, config)
    }
}
