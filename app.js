/* eslint-disable no-undef */
'use strict'
const express = require('express')
const bodyParser = require('body-parser')
require('dotenv').config()
const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
const messages = require('./messages/readMessages')
const swaggerUi = require('swagger-ui-express')
const yaml = require('yamljs')
const swaggerDocs = yaml.load('./swagger.yaml')
const iothub = require('azure-iothub')

const connectionString = 'HostName=' + process.env.HOSTNAME + ';SharedAccessKeyName=' + process.env.SHARED_ACCESS_KEY_NAME + ';SharedAccessKey=' + process.env.SHARED_ACCESS_KEY + ';'
const messagesConnectionString = 'Endpoint=' + process.env.EVENTHUBSCOMPATIBLEENDPOINT + ';EntityPath=' + process.env.EVENTHUBSCOMPATIBLEPATH + ';SharedAccessKeyName=' + process.env.SHARED_ACCESS_KEY_NAME + ';SharedAccessKey=' + process.env.SHARED_ACCESS_KEY + ';'
const registry = iothub.Registry.fromConnectionString(connectionString)

app.post('/deviceInfo', (req, res) => {
	const deviceId = req.body.deviceId
	registry.list(function (err, deviceList) {
		const searchedDevice = deviceList.find(Device => Device.deviceId === deviceId)              
		if(!searchedDevice) return res.status(400).json('Device ID unknown')
		deviceList.forEach(function (device) {
			if(device.deviceId === deviceId){
				const primaryKey = device.authentication ? device.authentication.symmetricKey.primaryKey : 'no primary key'
				const secondaryKey = device.authentication ? device.authentication.symmetricKey.secondaryKey : 'no secondary key'
				return res.json({
					primaryKey,
					secondaryKey
				})
			}
		})
	})
})

messages.readMessages(messagesConnectionString)

if (process.env.NODE_ENV !== 'production') {
	app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))
}

app.listen(process.env.PORT || 8080, () => {
	console.log('Server listening on : http://localhost:8080')
})