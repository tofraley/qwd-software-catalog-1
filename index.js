const express = require('express');
const fs = require('fs');
const yaml = require('js-yaml');

const app = express();

async function getServiceData() {
  const services = yaml.load(fs.readFileSync('services.yaml', 'utf8'));
  
  // Add health status to each service
  for (let service of services.services) {
    try {
      if (service.health_endpoint) {
        const response = await fetch(service.health_endpoint, { 
          timeout: 5000,
          signal: AbortSignal.timeout(5000)
        });
        service.status = response.ok ? 'healthy' : 'unhealthy';
      }
    } catch (error) {
      service.status = 'unhealthy';
    }
  }
  console.log(services);

  return services;
}

app.get('/', async (req, res) => {
  const services = await getServiceData();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Service Catalog</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .service { border: 1px solid #ddd; margin: 10px 0; padding: 20px; }
        .service h3 { margin: 0 0 10px 0; }
        .owner { color: #666; font-style: italic; }
        .status { font-weight: bold; }
        .healthy { color: green; }
        .unhealthy { color: red; }
      </style>
    </head>
    <body>
      <h1>Service Catalog</h1>
      ${services.services.map(service => `
        <div class="service">
          <h3>${service.name} 
            ${service.status ? `<span class="status ${service.status}">(${service.status})</span>` : ''}
          </h3>
          <p>${service.description}</p>
          <p class="owner">Owner: ${service.owner}</p>
          <a href="${service.repo}">View Repository</a>
        </div>
      `).join('')}
    </body>
    </html>
  `;

  res.send(html);
});

app.listen(3010, () => console.log('Catalog running on port 3010'));
