const { readFileSync, writeFileSync } = require('fs')

// Bitwarden Version: 2026.3.0 / Server Version: 2026.4.0

const ITEM_TYPES_ENUM = {
    LOGIN: 1,
    NOTE: 2,
    CARD: 3,
    IDENTITY: 4,
}

if (process.argv.slice(2).length !== 1) {
    console.log("Usage: node censor.js <bitwarden_export.json>")
    process.exit(1)
}

// 1. Parse vault JSON vault export

let vault = undefined

try {
    const vaultContent = readFileSync(process.argv[2], 'utf8')
    try {
        vault = JSON.parse(vaultContent)
    } catch (SyntaxError) {
        console.log(`Vault export file '${process.argv[2]}' is not a valid JSON file`)
        process.exit(1)
    }
} catch (FileNotFoundException) {
    console.log(`File ${process.argv[2]} not found`)
    process.exit(1)
}

if (vault === undefined || !Object.keys(vault).length || !vault.hasOwnProperty('items')) {
    console.log('Invalid or empty vault export')
    process.exit(1)
}

const vaultItems = vault['items']

// 2. Censor sensitive information

vaultItems.forEach((item, index) => {
    if (item['type'] !== ITEM_TYPES_ENUM.LOGIN) {
        delete vaultItems[index]
        return
    }

    delete item['passwordHistory']
    delete item['notes']
    delete item['fields']

    const loginInfo = item['login']

    delete loginInfo["fido2Credentials"]
    delete loginInfo["password"]
    delete loginInfo["totp"]
})

// 3. Write censored vault export to file

const currentTimestamp = new Date().toISOString()
    .replace(/:/g, '-')
    .replace(/\./g, '-')

writeFileSync(`bitwarden_export_censored_${currentTimestamp}.json`, JSON.stringify(vault))