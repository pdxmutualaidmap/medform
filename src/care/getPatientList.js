
const { getSheetInfo } = require('../utils/googleSheets')

const handler = async () => {
  try {
    const doc = await getSheetInfo(process.env.MEDFORM_SHEET_ID)
    return { status: 200, data: doc.sheetsByIndex.map(sheet => sheet.title) }
  } catch (e) {
    return { status: e.status || 500, message: e.message || e }
  }
}

module.exports = {
  handler
}
