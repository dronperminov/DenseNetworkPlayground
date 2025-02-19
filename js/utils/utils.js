function SetAttributes(element, attributes) {
    if (attributes === null)
        return

    for (let [name, value] of Object.entries(attributes)) {
        if (name == "innerText")
            element.innerText = value
        else if (name == "innerHTML")
            element.innerHTML = value
        else if (name == "textContent")
            element.textContent = value
        else
            element.setAttribute(name, value)
    }
}

function MakeElement(parent = null, attributes = null, tagName = "div") {
    let element = null

    if (["svg", "path", "g", "circle", "text"].indexOf(tagName) > -1) {
        element = document.createElementNS("http://www.w3.org/2000/svg", tagName)
    }
    else {
        element = document.createElement(tagName)
    }

    SetAttributes(element, attributes)

    if (parent !== null)
        parent.appendChild(element)

    return element
}

function AddClassName(element, className, condition) {
    if (condition)
        element.classList.add(className)
    else
        element.classList.remove(className)
}

function Round(value, scale = 100) {
    return Math.round(value * scale) / scale
}
