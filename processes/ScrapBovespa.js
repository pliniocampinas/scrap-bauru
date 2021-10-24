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

const evaluateUrlsSecretarias = async (page) => {
  const dropdownMenuSecretarias = '.dropdown-menu.secretarias'
  await page.waitForSelector(dropdownMenuSecretarias)

  // Extrai resultados da pagina
  const urlsSecretarias = await page.evaluate((dropdownSelector) => {

      const secretarias = []
      let encontrouTodasSecretarias = false
      document.querySelectorAll(dropdownSelector + ' li').forEach( (listItem) => {
        if(encontrouTodasSecretarias) {
          return
        }
        // Pega todos até a divisória, não pega orgão municipais
        if(listItem.classList.contains('divider')) {
          encontrouTodasSecretarias = true
          return
        }

        const urlSecretaria = listItem.querySelector('a').href
        secretarias.push(urlSecretaria)
      })

      // Retira ultima linha de 'Todos os Serviços...'
      secretarias.pop()
      return secretarias
  }, dropdownMenuSecretarias)

  return urlsSecretarias
}

const evaluateDadosSecretario = async (page) => {
  await page.waitForSelector('.equipe-governo')

  // Extrai resultados da pagina
  const dadosSecretario = await page.evaluate((context) => {
    const dados = document.querySelector('.equipe-governo').innerHTML
    return dados
  })

  return dadosSecretario
}

module.exports = {
  async run() {
    console.log('Buscando dados...')
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    // Site
    const baseUrl = 'http://www.b3.com.br/pt_br/market-data-e-indices/indices/indices-amplos/indice-ibovespa-ibovespa-composicao-da-carteira.htm'
    console.log('Navegando para ', baseUrl)
    await page.goto(baseUrl)
    // Extrai resultados da pagina
    console.log('Pega tabela paginada');
    const urlsSecretarias = await evaluateUrlsSecretarias(page)
    // Loga no console
    console.log('Urls encontradas')
    console.log(urlsSecretarias)
    // Exporta Csv
    exportCsv("./scrapped-content/urls-secretarias.csv", urlsSecretarias, item => item)

    // Navega para cada uma das secretarias e busca dados sobre o secretario
    const listaDadosSecretarios = []
    for (const urlSecretaria of urlsSecretarias) {
      console.log(`navegando para: ${urlSecretaria}`)
      await page.goto(urlSecretaria)

      const dadosSecretario =  await evaluateDadosSecretario(page)
      listaDadosSecretarios.push(dadosSecretario)
    }
    console.log('ListaDadosSecretarios')
    console.log(listaDadosSecretarios)
    console.log('----------------------')
    // Exporta Csv
    exportCsv("./scrapped-content/lista-dados-secretarios.csv", listaDadosSecretarios, item => item)

    await browser.close()
  }
}