const puppeteer = require('puppeteer')
const fs = require('fs')

const exportCsv = (filePath, list, stringfyListItem) => {
  // Exportar para json/xls
  let csvContent = ''
  list.forEach(function(item) {
      let row = stringfyListItem(item)
      csvContent += row + "\r\n";
  }); 

  fs.writeFile(filePath, csvContent, function(err) {
    if(err) {
      return console.log(err);
    }
    console.log("Arquivo Salvo!");
  });
}

const evaluatePageEmpresasListadas = async (page) => {
  const cardSelector = '.card-body'

  const companiesCardData = await page.evaluate((cardSelector) => {

    const iframeDocument = document.querySelector('#bvmf_iframe').contentWindow.document
    const companiesCardData = []
    iframeDocument.querySelectorAll(cardSelector).forEach( (listItem) => {
      const companyTitle = listItem.querySelector('.card-title2').innerText
      const companyLongName = listItem.querySelector('.card-text').innerText
      const companyShortName = listItem.querySelector('.card-nome').innerText

      const companyData = {
        title: companyTitle,
        longName: companyLongName,
        shortName: companyShortName,
      }

      companiesCardData.push(companyData)
    })

    return companiesCardData
  }, cardSelector)

  return companiesCardData
}

const clickSearchAll = async (page) => {
  await page.evaluate(() => {
    const iframeDocument = document.querySelector('#bvmf_iframe').contentWindow.document
    const searchAllButtonSelector = 'app-companies-home-filter-name button.btn-light'
    iframeDocument.querySelector(searchAllButtonSelector).click()
  })
}

module.exports = {
  async run() {
    console.log('Buscando dados...')
    const browser = await puppeteer.launch({
      args: [
         '--disable-web-security'
      ]
    })
    const page = await browser.newPage()

    // Site
    const baseUrl = 'https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/renda-variavel/empresas-listadas.htm'
    console.log('Navegando para ', baseUrl)
    await page.goto(baseUrl)

    await page.waitForSelector('#bvmf_iframe')
    await clickSearchAll(page)
    await page.waitForTimeout(5000)

    // Wait for the first card
    const companiesCardData = await evaluatePageEmpresasListadas(page)

    // Exporta Csv
    exportCsv("./scrapped-content/lista-empresas.csv", companiesCardData, item => JSON.stringify(item))

    await browser.close()
  }
}