const removeMaterialButton = () => {
  const button = document.createElement('button')
  button.classList.add('p-button--negative', 'is-inline')
  button.textContent = 'Remove'
  button.onclick = function (event) {
    event.preventDefault()
    this.parentNode.parentNode.removeChild(this.parentNode)
  }
  return button
}

const addMaterial = (e) => {
  e.preventDefault()
  const tableBody = document.getElementById('materials-used-table-body')
  const tableRow = document.createElement('tr')
  const materialName = document.getElementById('material-name')
  const materialQuantity = document.getElementById('material-quantity')
  if (!materialName.value || !materialQuantity.value) return
  const materialNameDataElement = document.createElement('td')
  materialNameDataElement.classList.add('materialData')
  materialNameDataElement.textContent = materialName.value.toString()
  tableRow.appendChild(materialNameDataElement)
  const materialQuantityDataElement = document.createElement('td')
  materialQuantityDataElement.classList.add('materialQuantity')
  materialQuantityDataElement.textContent = materialQuantity.value.toString()
  tableRow.appendChild(materialQuantityDataElement)
  tableRow.appendChild(removeMaterialButton())
  tableBody.appendChild(tableRow)
}

const addMaterialsOptions = () => {
  const datalist = document.getElementById('materials-datalist')
  constants.materials.medical.forEach(item => {
    const itemElem = document.createElement('option')
    itemElem.text = item
    itemElem.value = item
    datalist.appendChild(itemElem)
  })
}

const clearForm = (event) => {
  if (event) {
    event.preventDefault()
  }
  const careNotes = document.getElementById('care-notes')
  const followUp = document.getElementById('follow-up')
  const materialName = document.getElementById('material-name')
  const materialQuantity = document.getElementById('material-quantity')
  const patientInfo = document.getElementById('patient-info')
  const tableBody = document.getElementById('materials-used-table-body')
  careNotes.value = null
  followUp.value = null
  materialName.value = null
  materialQuantity.value = null
  patientInfo.value = null
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild)
  }
}

const createRequestBody = () => ({
  careNotes: document.getElementById('care-notes').value,
  followUp: document.getElementById('follow-up').value,
  materialName: document.getElementById('material-name').value,
  materialQuantity: document.getElementById('material-quantity').value,
  patientInfo: document.getElementById('patient-info').value,
  materials: document.getElementById('materials-used-table-body').childNodes.map(row => ({
    materialData: row.querySelector('materialData').textContent,
    materialQuantity: row.querySelector('materialQuantity').textContent
  }))
})

const initPage = () => {
  addMaterialsOptions()
}

const submitForm = (event) => {
  event.preventDefault()
  clearForm()
}

window.addEventListener('load', initPage)

const constants = {
  "api": {
    "basePath": "",
    "actions": {
      "addCare": {
        "method": "post",
        "path": "/care"
      }
    }
  },
  "materials": {
    "general": [
      "Blanket",
      "Sunscreen",
      "Tarp",
      "Water"
    ],
    "medical": [
      "Bandage",
      "Chux",
      "Cleansing wipes",
      "Gauze",
      "Gloves",
      "Glucose test strip",
      "Irrigation syringe",
      "Lancet",
      "Mask",
      "Narcan",
      "Neosporin"
    ]
  }
}
