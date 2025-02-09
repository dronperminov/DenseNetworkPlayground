function Data(inputs, outputs, dimension) {
	this.inputs = inputs
	this.outputs = outputs
	this.dimension = dimension
	this.length = outputs.length
}

Data.prototype.Append = function(data) {
	if (this.dimension != data.dimension)
		throw new Error(`The added data dimension (${data.dimension}) does not match the existing dimension (${this.dimension})`)

	this.inputs = this.ConcatArrays(this.inputs, data.inputs)
	this.outputs = this.ConcatArrays(this.outputs, data.outputs)
	this.length += data.length
	return this
}

Data.prototype.GetMinMaxStatistic = function() {
	let min = new Float64Array(this.dimension).fill(Infinity)
	let max = new Float64Array(this.dimension).fill(-Infinity)

	for (let i = 0; i < this.length; i++) {
		for (let j = 0; j < this.dimension; j++) {
			let value = this.inputs[i * this.dimension + j]

			min[j] = Math.min(min[j], value)
			max[j] = Math.max(max[j], value)
		}
	}

	return {min, max}
}

Data.prototype.GetMeanStdStatistic = function() {
	let mean = new Float64Array(this.dimension).fill(0)
	let std = new Float64Array(this.dimension).fill(0)
	let length = Math.max(this.length, 1)

	for (let i = 0; i < this.length; i++)
		for (let j = 0; j < this.dimension; j++)
			mean[j] += this.inputs[i * this.dimension + j]

	for (let j = 0; j < this.dimension; j++)
		mean[j] /= length

	for (let i = 0; i < this.length; i++)
		for (let j = 0; j < this.dimension; j++)
			std[j] += Math.pow(this.inputs[i * this.dimension + j] - mean[j], 2)

	for (let j = 0; j < this.dimension; j++)
		std[j] = Math.sqrt(std[j] / length)

	return {mean, std}
}

Data.prototype.GetLabelsStatistic = function() {
	let labels = {}

	for (let i = 0; i < this.length; i++) {
		let label = `${this.outputs[i]}`

		if (label in labels)
			labels[label] += 1
		else
			labels[label] = 1
	}

	return labels
}

Data.prototype.GetStatistic = function() {
	let {min, max} = this.GetMinMaxStatistic()
	let {mean, std} = this.GetMeanStdStatistic()
	let labels = this.GetLabelsStatistic()
	return {min, max, mean, std, labels}
}

Data.prototype.ConcatArrays = function(array1, array2) {
	let array = new Float64Array(array1.length + array2.length)
	array.set(array1)
	array.set(array2, array1.length)
	return array
}
