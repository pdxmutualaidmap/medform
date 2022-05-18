const { SecretsManager } = require('aws-sdk')
const { GoogleSpreadsheet } = require('google-spreadsheet')

const ssmClient = new SecretsManager({ region: process.env.AWS_REGION })

const getSheetInfo = async (sheetId) => {
  const secretsJSON = await ssmClient.getSecretValue({ SecretId: process.env.GOOGLE_API_KEY_NAME }).promise()
  const { client_email, private_key } = JSON.parse(secretsJSON.SecretString)
  const doc = new GoogleSpreadsheet(sheetId)
  await doc.useServiceAccountAuth({
    client_email,
    private_key
  })
  await doc.loadInfo()
  return doc
}

module.exports = {
  getSheetInfo
}
