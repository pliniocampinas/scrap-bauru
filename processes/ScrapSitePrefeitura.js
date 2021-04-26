const puppeteer = require('puppeteer')
const fs = require('fs')

module.exports = {
  async run() {
    console.log('ScrapSitePrefeitura run')
    const browser = await puppeteer.launch();

    const page = await browser.newPage();
  
    await page.goto('https://www2.bauru.sp.gov.br/');
  
    const dropdownMenuSecretarias = '.dropdown-menu.secretarias';
    await page.waitForSelector(dropdownMenuSecretarias);
  
    // Extrai resultados da pagina
    const urlsSecretarias = await page.evaluate((dropdown) => {

        const secretarias = []
        let encontrouTodasSecretarias = false
        document.querySelectorAll('.dropdown-menu.secretarias li').forEach( (listItem) => {
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
        return secretarias;
    }, dropdownMenuSecretarias);
  
    // Exportar para json/xls
    let csvContent = ''
    urlsSecretarias.forEach(function(url) {
        let row = url
        csvContent += row + "\r\n";
    }); 
  
    console.log(csvContent);

    fs.writeFile("./test.csv", csvContent, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("Arquivo Salvo!");
    });
  
    await browser.close();
  }
}
