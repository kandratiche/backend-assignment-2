const express = require('express');
const cors = require('cors');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

function getCountryData(countryName) {
    return new Promise((resolve, reject) => {
        const cleanCountryName = countryName.replace(/\s+/g, '%20');
        const url = `https://restcountries.com/v3.1/name/${cleanCountryName}?fullText=true`;
        
        https.get(url, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data = data + chunk;
            });

            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    
                    if (result.status === 404 || result.message) {
                        resolve(null);
                        return;
                    }

                    const country = result[0];
                    if (!country) {
                        resolve(null);
                        return;
                    }

                    let languages = 'N/A';
                    if (country.languages) {
                        const langArray = [];
                        for (let code in country.languages) {
                            langArray.push(country.languages[code]);
                        }
                        languages = langArray.join(', ');
                    }

                    let currency = 'N/A';
                    let currencyCode = null;
                    if (country.currencies) {
                        const currArray = [];
                        for (let code in country.currencies) {
                            const curr = country.currencies[code];
                            currArray.push(curr.name + ' (' + code + ')');
                            if (!currencyCode) {
                                currencyCode = code;
                            }
                        }
                        currency = currArray.join(', ');
                    }

                    let capital = 'N/A';
                    if (country.capital && country.capital.length > 0) {
                        capital = country.capital[0];
                    }

                    let flag = null;
                    if (country.flags && country.flags.png) {
                        flag = country.flags.png;
                    }

                    const countryData = {
                        countryName: country.name.common || 'N/A',
                        capital: capital,
                        languages: languages,
                        currency: currency,
                        currencyCode: currencyCode,
                        flag: flag
                    };

                    resolve(countryData);

                } catch (error) {
                    reject(new Error('Failed to process country data'));
                }
            });

        }).on('error', (error) => {
            reject(error);
        });
    });
}

function getExchangeRates(currencyCode) {
    return new Promise((resolve, reject) => {
        const url = `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/${currencyCode}`;
        
        https.get(url, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data = data + chunk;
            });

            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    
                    if (result.result === 'error' || result.error) {
                        resolve(null);
                        return;
                    }

                    const rates = result.conversion_rates || result.rates;
                    
                    if (!rates) {
                        resolve(null);
                        return;
                    }

                    const exchangeData = {
                        baseCurrency: currencyCode,
                        usdRate: rates.USD || 'N/A',
                        kztRate: rates.KZT || 'N/A'
                    };

                    console.log('Exchange rates fetched:', exchangeData);
                    resolve(exchangeData);

                } catch (error) {
                    reject(new Error('Failed to parse exchange rate data'));
                }
            });

        }).on('error', (error) => {
            reject(error);
        });
    });
}

function getNewsHeadlines(countryName) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.NEWS_API_KEY;
        
        if (!apiKey) {
            console.log('News API key not found');
            resolve(null);
            return;
        }

        const query = encodeURIComponent(countryName);
        const url = `https://newsapi.org/v2/everything?q=${query}&language=en&pageSize=5&apiKey=${apiKey}`;
        
        console.log('Fetching news for:', countryName);

        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'RandomUserExplorer/1.0 (Node.js Application)'
            }
        };

        https.get(options, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data = data + chunk;
            });

            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    
                    if (result.status === 'error' || !result.articles) {
                        console.log('News API error or no articles found');
                        console.log('Result:', result);
                        resolve(null);
                        return;
                    }

                    const articles = [];
                    for (let i = 0; i < result.articles.length && i < 5; i++) {
                        const article = result.articles[i];
                        
                        articles.push({
                            title: article.title || 'No title',
                            description: article.description || 'No description available',
                            image: article.urlToImage || null,
                            url: article.url || '#'
                        });
                    }

                    console.log('Fetched', articles.length, 'news articles');
                    resolve(articles);

                } catch (error) {
                    console.error('Error parsing news data:', error);
                    reject(new Error('Failed to parse news data'));
                }
            });

        }).on('error', (error) => {
            console.error('News API request error:', error);
            reject(error);
        });
    });
}

app.get('/api/random-user', (req, res) => {
    const options = {
        hostname: 'randomuser.me',
        path: '/api/',
        method: 'GET'
    };

    const request = https.request(options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data = data + chunk;
        });

        response.on('end', async () => {
            try {
                const result = JSON.parse(data);
                const user = result.results[0];

                const userData = {
                    firstName: user.name.first,
                    lastName: user.name.last,
                    gender: user.gender,
                    profilePicture: user.picture.large,
                    age: user.dob.age,
                    dateOfBirth: new Date(user.dob.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    city: user.location.city,
                    country: user.location.country,
                    fullAddress: user.location.street.number + ' ' + user.location.street.name
                };

                try {
                    const countryData = await getCountryData(user.location.country);
                    
                    if (countryData) {
                        userData.countryDetails = countryData;

                        if (countryData.currencyCode) {
                            try {
                                const exchangeData = await getExchangeRates(countryData.currencyCode);
                                userData.exchangeRates = exchangeData;
                            } catch (error) {
                                console.error('Exchange rate error:', error.message);
                                userData.exchangeRates = null;
                            }
                        }
                    } else {
                        userData.countryDetails = {
                            countryName: user.location.country,
                            capital: 'N/A',
                            languages: 'N/A',
                            currency: 'N/A',
                            currencyCode: null,
                            flag: null
                        };
                        userData.exchangeRates = null;
                    }

                } catch (error) {
                    userData.countryDetails = {
                        countryName: user.location.country,
                        capital: 'N/A',
                        languages: 'N/A',
                        currency: 'N/A',
                        currencyCode: null,
                        flag: null
                    };
                    userData.exchangeRates = null;
                }

                try {
                    const newsArticles = await getNewsHeadlines(user.location.country);
                    userData.newsHeadlines = newsArticles;
                } catch (error) {
                    console.error('News API error:', error.message);
                    userData.newsHeadlines = null;
                }

                res.json(userData);

            } catch (error) {
                res.status(500).json({ error: 'Failed to get user data' });
            }
        });
    });

    request.on('error', (error) => {
        res.status(500).json({ error: 'Failed to fetch user data' });
    });

    request.end();
});

app.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT);
    if (!process.env.NEWS_API_KEY) {
        console.log('WARNING: NEWS_API_KEY not found in .env file');
    }
});